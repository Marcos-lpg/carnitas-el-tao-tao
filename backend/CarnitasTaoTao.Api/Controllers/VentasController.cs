using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.RegularExpressions;
using CarnitasTaoTao.Core.Data;
using CarnitasTaoTao.Core.Entities;
using CarnitasTaoTao.Core.DTOs;

namespace CarnitasTaoTao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VentasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VentasController(ApplicationDbContext context)
        {
            _context = context;
        }

       // GET: api/ventas
        [HttpGet]
        public async Task<IActionResult> GetVentas()
        {
            var cajaAbierta = await _context.CajaTurnos.FirstOrDefaultAsync(c => c.EstaAbierta);

            if (cajaAbierta == null)
            {
                return Ok(new List<VentaDto>());
            }

            var ventas = await _context.Ventas
                .Where(v => v.CajaTurnoId == cajaAbierta.Id)
                .Include(v => v.Detalles)
                .OrderByDescending(v => v.Fecha)
                .Select(v => new VentaDto
                {
                    Id = v.Id,
                    Fecha = v.Fecha,
                    Total = v.Total,
                    DescripcionPedido = v.DescripcionPedido,
                    NombreCliente = v.NombreCliente,
                    DireccionEnvio = v.DireccionEnvio,
                    EstadoPago = v.EstadoPago,
                    MetodoPago = v.MetodoPago,
                    Detalles = v.Detalles.Select(d => new DetalleVentaDto
                    {
                        Id = d.Id,
                        ProductoId = d.ProductoId,
                        Cantidad = d.Cantidad,
                        PrecioUnitario = d.PrecioUnitario
                    }).ToList()
                })
                .ToListAsync();

            return Ok(ventas);
        }

        // POST: api/ventas
        [HttpPost]
        public async Task<IActionResult> RegistrarVenta([FromBody] CrearVentaDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Los datos de la venta son inválidos.");
            }

            var cajaAbierta = await _context.CajaTurnos.FirstOrDefaultAsync(c => c.EstaAbierta);
            if (cajaAbierta == null)
            {
                return BadRequest(new { mensaje = "No se puede registrar la venta porque no hay ningún turno de caja abierto." });
            }

            // Limpiamos la descripción y el cliente desde el registro para que nunca guarden símbolos raros
            var descripcionLimpia = LimpiarTexto(dto.DescripcionPedido);
            var clienteLimpio = LimpiarTexto(dto.NombreCliente);

            var nuevaVenta = new Venta
            {
                Fecha = DateTime.Now,
                DescripcionPedido = descripcionLimpia,
                NombreCliente = string.IsNullOrEmpty(clienteLimpio) ? "Mostrador" : clienteLimpio,
                DireccionEnvio = dto.DireccionEnvio,
                EstadoPago = string.IsNullOrEmpty(dto.EstadoPago) ? "Pagado" : dto.EstadoPago,
                MetodoPago = string.IsNullOrEmpty(dto.MetodoPago) ? "Efectivo" : dto.MetodoPago,
                CajaTurnoId = cajaAbierta.Id,
                Detalles = new List<DetalleVenta>()
            };

            if (dto.Detalles != null && dto.Detalles.Any())
            {
                var productoIds = dto.Detalles.Select(d => d.ProductoId).ToList();
                var productosDb = await _context.Productos
                    .Where(p => productoIds.Contains(p.Id))
                    .ToListAsync();

                foreach (var item in dto.Detalles)
                {
                    var producto = productosDb.FirstOrDefault(p => p.Id == item.ProductoId);
                    if (producto == null)
                    {
                        return BadRequest($"El producto con ID {item.ProductoId} no existe.");
                    }

                    if (producto.Stock < item.Cantidad)
                    {
                        return BadRequest($"Stock insuficiente para '{producto.Nombre}'. Disponible: {producto.Stock}, Solicitado: {item.Cantidad}");
                    }

                    producto.Stock -= item.Cantidad;

                    nuevaVenta.Detalles.Add(new DetalleVenta
                    {
                        ProductoId = item.ProductoId,
                        Cantidad = item.Cantidad,
                        PrecioUnitario = item.PrecioUnitario
                    });
                }

                nuevaVenta.Total = nuevaVenta.Detalles.Sum(d => d.Cantidad * d.PrecioUnitario);
            }
            else
            {
                if (dto.Total <= 0)
                {
                    return BadRequest("El total de la venta debe ser mayor a cero.");
                }
                nuevaVenta.Total = dto.Total;
            }

            _context.Ventas.Add(nuevaVenta);
            await _context.SaveChangesAsync();

            return Ok(new 
            { 
                mensaje = "Venta registrada con éxito", 
                ventaId = nuevaVenta.Id, 
                total = nuevaVenta.Total 
            });
        }

        // GET: api/ventas/exportar
        [HttpGet("exportar")]
        public async Task<IActionResult> ExportarVentas()
        {
            var cajaAbierta = await _context.CajaTurnos.FirstOrDefaultAsync(c => c.EstaAbierta);
            
            List<Venta> ventas;
            if (cajaAbierta != null)
            {
                ventas = await _context.Ventas
                    .Where(v => v.CajaTurnoId == cajaAbierta.Id)
                    .OrderByDescending(v => v.Fecha)
                    .ToListAsync();
            }
            else
            {
                ventas = await _context.Ventas
                    .OrderByDescending(v => v.Fecha)
                    .ToListAsync();
            }

            var builder = new StringBuilder();
            builder.AppendLine("ID Venta,Cliente,Descripcion,Total,Fecha");

            foreach (var v in ventas)
            {
                // Limpieza profunda asegurando quitar cualquier residuo viejo de la BD
                var descripcionLimpia = LimpiarTexto(v.DescripcionPedido);
                var clienteLimpio = LimpiarTexto(v.NombreCliente);

                var cliente = $"\"{clienteLimpio.Replace("\"", "\"\"")}\"";
                var descripcion = $"\"{descripcionLimpia.Replace("\"", "\"\"")}\"";
                var fecha = v.Fecha.ToString("yyyy-MM-dd HH:mm:ss");

                builder.AppendLine($"{v.Id},{cliente},{descripcion},{v.Total},{fecha}");
            }

            var csvContent = builder.ToString();
            var utf8BytesWithoutBom = Encoding.UTF8.GetBytes(csvContent);
            var bom = new byte[] { 0xEF, 0xBB, 0xBF };
            var finalBytes = bom.Concat(utf8BytesWithoutBom).ToArray();

            return File(finalBytes, "text/csv", $"ReporteVentas_{DateTime.Now:yyyyMMdd_HHmmss}.csv");
        }

        // Método robusto para limpiar caracteres raros, emojis y basura de codificación
        private string LimpiarTexto(string texto)
        {
            if (string.IsNullOrEmpty(texto)) return string.Empty;

            // 1. Eliminar caracteres específicos que se quedaron volando de emojis viejos (ð, Ÿ, Œ, ®, etc.)
            texto = texto.Replace("ð", "").Replace("Ÿ", "").Replace("Œ", "").Replace("®", "").Replace("™", "").Replace("£", "").Replace("¥", "");

            // 2. Filtrar únicamente texto estándar, números, espacios y signos comunes de puntuación/moneda
            return Regex.Replace(texto, @"[^\w\s\d\+\-\$\(\)\.,/]", string.Empty);
        }
    }
}