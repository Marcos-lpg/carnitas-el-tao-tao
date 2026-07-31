using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarnitasTaoTao.Core.Data;
using CarnitasTaoTao.Core.Entities;

namespace CarnitasTaoTao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductosController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/productos
        [HttpGet]
        public async Task<IActionResult> GetProductos()
        {
            var productos = await _context.Productos.ToListAsync();
            return Ok(productos);
        }

        // GET: api/productos/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProducto(int id)
        {
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null) return NotFound("Producto no encontrado.");

            return Ok(producto);
        }

        // POST: api/productos
        [HttpPost]
        public async Task<IActionResult> CrearProducto([FromBody] Producto producto)
        {
            _context.Productos.Add(producto);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProducto), new { id = producto.Id }, producto);
        }

        // PUT: api/productos/5
        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarProducto(int id, [FromBody] Producto producto)
        {
            if (id != producto.Id) return BadRequest("El ID no coincide.");

            _context.Entry(producto).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Productos.Any(e => e.Id == id))
                    return NotFound("Producto no encontrado.");
                throw;
            }

            return NoContent();
        }

        // DELETE: api/productos/5 (Desactivación / Borrado lógico)
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarProducto(int id)
        {
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null) return NotFound("Producto no encontrado.");

            // En lugar de borrar de la DB, lo marcamos como inactivo
            producto.Activo = false;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Producto desactivado correctamente." });
        }
    }
}