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
            return await _context.Insumos.ToListAsync();
        }

        // POST: api/insumos
        [HttpPost]
        public async Task<ActionResult<Insumo>> PostInsumo(Insumo insumo)
        {
            _context.Insumos.Add(insumo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInsumos), new { id = insumo.Id }, insumo);
        }
    }
}