using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarnitasTaoTao.Core.Data; // <--- Asegúrate de que apunta a donde está tu ApplicationDbContext
using CarnitasTaoTao.Core.Entities;
namespace CarnitasTaoTao.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CajaController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CajaController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Consultar estado actual (Saber si hay caja abierta hoy)
        [HttpGet("estado-actual")]
        public async Task<IActionResult> ObtenerEstadoActual()
        {
            var cajaAbierta = await _context.CajaTurnos
                .Include(c => c.Ventas)
                .Include(c => c.Gastos)
                .FirstOrDefaultAsync(c => c.EstaAbierta);

            if (cajaAbierta == null)
            {
                return Ok(new { abierta = false, mensaje = "No hay ninguna caja abierta actualmente." });
            }

            return Ok(new { abierta = true, caja = cajaAbierta });
        }

        // 2. Abrir Caja
        [HttpPost("abrir")]
        public async Task<IActionResult> AbrirCaja([FromBody] AbrirCajaDto dto)
        {
            // Validar que no exista ya una caja abierta
            var cajaActiva = await _context.CajaTurnos.FirstOrDefaultAsync(c => c.EstaAbierta);
            if (cajaActiva != null)
            {
                return BadRequest(new { mensaje = "Ya hay una caja abierta. Debe cerrarla antes de abrir un nuevo turno." });
            }

            var nuevaCaja = new CajaTurno
            {
                FechaApertura = DateTime.Now,
                FondoInicial = dto.FondoInicial,
                EstaAbierta = true
            };

            _context.CajaTurnos.Add(nuevaCaja);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Caja abierta exitosamente", caja = nuevaCaja });
        }

        // 3. Cerrar Caja (Corte del día)
        [HttpPost("cerrar/{id}")]
        public async Task<IActionResult> CerrarCaja(int id)
        {
            var caja = await _context.CajaTurnos
                .Include(c => c.Ventas)
                .Include(c => c.Gastos)
                .FirstOrDefaultAsync(c => c.Id == id && c.EstaAbierta);

            if (caja == null)
            {
                return NotFound(new { mensaje = "Caja no encontrada o ya se encuentra cerrada." });
            }

            // Calcular totales
            decimal totalVentas = caja.Ventas.Sum(v => v.Total);
            decimal totalGastos = caja.Gastos.Sum(g => g.Monto); // Asumiendo que tu propiedad de monto en gastos se llama Monto

            caja.TotalVentas = totalVentas;
            caja.TotalGastos = totalGastos;
            caja.EfectivoEnCaja = caja.FondoInicial + totalVentas - totalGastos;
            caja.FechaCierre = DateTime.Now;
            caja.EstaAbierta = false;

            _context.CajaTurnos.Update(caja);
            await _context.SaveChangesAsync();

            return Ok(new 
            { 
                mensaje = "Corte de caja realizado con éxito", 
                resumen = new {
                    caja.FondoInicial,
                    caja.TotalVentas,
                    caja.TotalGastos,
                    caja.EfectivoEnCaja,
                    caja.FechaApertura,
                    caja.FechaCierre
                }
            });
        }
    }

    public class AbrirCajaDto
    {
        public decimal FondoInicial { get; set; }
    }
}