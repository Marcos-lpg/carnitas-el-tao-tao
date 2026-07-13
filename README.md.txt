# 🐷 Carnitas El Tao Tao - Sistema de Administración

Este repositorio contiene la arquitectura inicial, documentación y el diseño del flujo de trabajo (Workflow) para el desarrollo del sistema de administración del negocio local "Carnitas El Tao Tao". Proyecto desarrollado con fines académicos.

## 🔄 Flujo de Trabajo en Git (Git Workflow)
Para el desarrollo de este proyecto se implementa un flujo de trabajo basado en **Feature Branches** (Ramas por Característica) para asegurar la estabilidad de la rama principal.

### Estructura de Ramas:
*   `main`: Rama de producción. Solo contiene código completamente estable, testeado y listo.
*   `feature/`: Ramas temporales utilizadas para desarrollar nuevos módulos o funciones de forma aislada.

### Estándar de Mensajes de Commit (Conventional Commits):
*   `feat:` Cuando se añade una nueva funcionalidad al sistema.
*   `fix:` Cuando se corrige un error en el código.
*   `docs:` Cambios exclusivos en la documentación o archivos de configuración inicial.