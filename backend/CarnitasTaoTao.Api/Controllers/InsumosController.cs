using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarnitasTaoTao.Core.Data;
using CarnitasTaoTao.Core.Entities;

namespace CarnitasTaoTao.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InsumosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InsumosController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/insumos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Insumo>>> GetInsumos()
        {
            // 1. Buscar la caja que esté abierta actualmente
            var cajaAbierta = await _context.CajaTurnos.FirstOrDefaultAsync(c => c.EstaAbierta);

            // 2. Si no hay caja abierta, retornamos una lista vacía para que aparezca en ceros
            if (cajaAbierta == null)
            {
                return Ok(new List<Insumo>());
            }

            // 3. Retornar únicamente los insumos vinculados al turno de caja activo
            var insumosDelTurno = await _context.Insumos
                .Where(i => i.CajaTurnoId == cajaAbierta.Id)
                .ToListAsync();

            return Ok(insumosDelTurno);
        }

        // POST: api/insumos
        [HttpPost]
        public async Task<ActionResult<Insumo>> PostInsumo(Insumo insumo)
        {
            // 1. Buscar la caja abierta actual
            var cajaAbierta = await _context.CajaTurnos.FirstOrDefaultAsync(c => c.EstaAbierta);
            if (cajaAbierta == null)
            {
                return BadRequest(new { mensaje = "No se pueden registrar insumos porque no hay ningún turno de caja abierto." });
            }

            // 2. Asignar el ID de la caja activa al insumo antes de guardarlo
            insumo.CajaTurnoId = cajaAbierta.Id;

            _context.Insumos.Add(insumo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInsumos), new { id = insumo.Id }, insumo);
        }
    }
}