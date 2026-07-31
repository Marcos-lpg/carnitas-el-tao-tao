namespace CarnitasTaoTao.Core.Entities;

public class DetalleVenta
{
    public int Id { get; set; }

    // Relación con la Venta
    public int VentaId { get; set; }
    public Venta? Venta { get; set; }

    // Relación con el Producto
    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    // Datos del producto vendido
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}