using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarnitasTaoTao.Core.Data;
using CarnitasTaoTao.Core.Entities;

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
        // Trae las ventas junto con sus detalles de productos
        [HttpGet]
        public async Task<IActionResult> GetVentas()
        {
            var ventas = await _context.Ventas
                .Include(v => v.Detalles)
                .ThenInclude(d => d.Producto)
                .ToListAsync();

            return Ok(ventas);
        }

        // POST: api/ventas
        // Registra la venta y guarda sus detalles
        [HttpPost]
        public async Task<IActionResult> RegistrarVenta([FromBody] Venta venta)
        {
            if (venta.Detalles == null || !venta.Detalles.Any())
            {
                return BadRequest("La venta debe contener al menos un producto.");
            }

            // Asignamos la fecha actual
            venta.Fecha = DateTime.UtcNow;

            // Calculamos el Total sumando los subtotales de cada renglón
            venta.Total = venta.Detalles.Sum(d => d.Subtotal);

            _context.Ventas.Add(venta);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Venta registrada con éxito", ventaId = venta.Id, total = venta.Total });
        }
    }
}