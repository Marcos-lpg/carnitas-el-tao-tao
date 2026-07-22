namespace CarnitasTaoTao.Core.Entities;

public class Venta
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public decimal Total { get; set; }
    public string MetodoPago { get; set; } = "Efectivo"; // Efectivo, Transferencia, Tarjeta
    public string? Observaciones { get; set; }
}