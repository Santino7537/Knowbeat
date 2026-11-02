// Logo de Knowbeat que toma el color del texto (currentColor) mediante una
// máscara CSS. Así se ve blanco en modo oscuro y oscuro en modo claro sin
// necesitar dos imágenes distintas.
//   variant="wordmark" → /Logo.png   (texto "Knowbeat")
//   variant="mark"     → /favicon.png (monograma "Kb")
const BrandLogo = ({ variant = "wordmark", className = "", label = "Knowbeat" }) => (
  <span
    role="img"
    aria-label={label}
    className={`kb-logo kb-logo-${variant} ${className}`}
  />
);

export default BrandLogo;
