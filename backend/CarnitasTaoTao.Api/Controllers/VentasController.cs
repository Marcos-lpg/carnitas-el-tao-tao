using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
            // 1. Buscar la caja que esté abierta actualmente
            var cajaAbierta = await _context.CajaTurnos.FirstOrDefaultAsync(c => c.EstaAbierta);

            // 2. Si no hay caja abierta, retornamos una lista vacía para que todo aparezca en ceros
            if (cajaAbierta == null)
            {
                return Ok(new List<VentaDto>());
            }

            // 3. Traer únicamente las ventas que pertenecen a la caja activa del turno actual
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

            // 1. BUSCAR LA CAJA ABIERTA ACTUALMENTE
            var cajaAbierta = await _context.CajaTurnos.FirstOrDefaultAsync(c => c.EstaAbierta);
            if (cajaAbierta == null)
            {
                return BadRequest(new { mensaje = "No se puede registrar la venta porque no hay ningún turno de caja abierto." });
            }

            var nuevaVenta = new Venta
            {
                Fecha = DateTime.Now,
                DescripcionPedido = dto.DescripcionPedido,
                NombreCliente = dto.NombreCliente,
                DireccionEnvio = dto.DireccionEnvio,
                EstadoPago = string.IsNullOrEmpty(dto.EstadoPago) ? "Pagado" : dto.EstadoPago,
                MetodoPago = string.IsNullOrEmpty(dto.MetodoPago) ? "Efectivo" : dto.MetodoPago,
                CajaTurnoId = cajaAbierta.Id, // Vincula la venta a la caja activa correctamente
                Detalles = new List<DetalleVenta>()
            };

            // CASO A: Si la venta trae productos del inventario con stock
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

                    // Descontamos el stock
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
                // CASO B: Venta flexible de mostrador (monto directo y descripción libre)
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
    }
}