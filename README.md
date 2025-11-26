# Bank Dashboard (Semi-Senior Assessment)

Aplicación web de análisis financiero y monitoreo técnico.

## Requisitos
* Node.js 18 o superior.
* NPM (incluido en Node).

## Instrucciones de Ejecución

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Configurar Variables de Entorno:**
    Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:
    ```
    BANK_API_KEY=MiClaveSecreta123
    BANK_API_BASE_URL=[https://mi-api-banco-843945314233.us-central1.run.app](https://mi-api-banco-843945314233.us-central1.run.app)
    NEXT_PUBLIC_ACCOUNT_ID=999
    ```

3.  **Iniciar servidor de desarrollo:**
    ```
    npm run dev
    ```

4.  **Acceso:**
    Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Stack Tecnológico
* **Framework:** Next.js 14 (App Router).
* **Estilos:** Tailwind CSS.
* **Gráficos:** Recharts.
* **Estado & Data Fetching:** React Context + Custom Hooks con Interceptores.