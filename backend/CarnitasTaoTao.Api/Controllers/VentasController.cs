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
        [HttpGet]
        public async Task<IActionResult> GetVentas()
        {
            var ventas = await _context.Ventas.ToListAsync();
            return Ok(ventas);
        }

        // POST: api/ventas
        [HttpPost]
        public async Task<IActionResult> RegistrarVenta([FromBody] Venta venta)
        {
            venta.Fecha = DateTime.Now; // Aseguramos la fecha actual de la venta
            _context.Ventas.Add(venta);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Venta registrada con éxito", ventaId = venta.Id });
        }
    }
}