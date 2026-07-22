namespace CarnitasTaoTao.Core.Entities;

public class Gasto
{
    public int Id { get; set; }
    public string Concepto { get; set; } = string.Empty; // Ej. Compra de carne, Gas, Verdura
    public decimal Monto { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public string Categoria { get; set; } = string.Empty; // Insumos, Servicios, Mantenimiento
}