namespace CarnitasTaoTao.Core.Entities;

public class Producto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty; // Ej. Carnitas, Bebidas, Complementos
    public decimal Precio { get; set; }
    public bool Activo { get; set; } = true;

    // Agregamos el control de inventario
    public int Stock { get; set; }
}