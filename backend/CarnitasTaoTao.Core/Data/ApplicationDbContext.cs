using CarnitasTaoTao.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace CarnitasTaoTao.Core.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Producto> Productos { get; set; }
        public DbSet<Venta> Ventas { get; set; }
        public DbSet<DetalleVenta> DetallesVentas { get; set; }
        public DbSet<Gasto> Gastos { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Insumo> Insumos { get; set; }
        public DbSet<CajaTurno> CajaTurnos { get; set; } // <--- Agregado

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Ajustes de precisión para decimales en MySQL
            modelBuilder.Entity<Producto>()
                .Property(p => p.Precio)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Venta>()
                .Property(v => v.Total)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Gasto>()
                .Property(g => g.Monto)
                .HasPrecision(18, 2);

            modelBuilder.Entity<DetalleVenta>()
                .Property(d => d.PrecioUnitario)
                .HasPrecision(18, 2);

            modelBuilder.Entity<DetalleVenta>()
                .Property(d => d.Subtotal)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Insumo>()
                .Property(i => i.Monto)
                .HasPrecision(18, 2);

            // Precisión para los decimales de CajaTurno
            modelBuilder.Entity<CajaTurno>()
                .Property(c => c.FondoInicial)
                .HasPrecision(18, 2);

            modelBuilder.Entity<CajaTurno>()
                .Property(c => c.TotalVentas)
                .HasPrecision(18, 2);

            modelBuilder.Entity<CajaTurno>()
                .Property(c => c.TotalGastos)
                .HasPrecision(18, 2);

            modelBuilder.Entity<CajaTurno>()
                .Property(c => c.EfectivoEnCaja)
                .HasPrecision(18, 2);
        }
    }
}