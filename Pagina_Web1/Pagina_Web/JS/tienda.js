/* ============================================
   BURGER FRIENDS — lógica de la tienda
   Arquitectura: dos módulos encapsulados
   (Orden y Opiniones) en vez de funciones sueltas.
   ============================================ */

const Orden = (() => {
  let articulos = []; // cada artículo: { nombre, precio }

  const listas = [
    document.getElementById('lista-resumen'),
    document.getElementById('lista-panel-orden'),
  ].filter(Boolean);

  const totales = [
    document.getElementById('total-resumen'),
    document.getElementById('total-panel'),
  ].filter(Boolean);

  const contador = document.getElementById('contador-pedido');

  function calcularTotal() {
    return articulos.reduce((suma, item) => suma + item.precio, 0);
  }

  function pintar() {
    const total = calcularTotal();

    totales.forEach(nodo => { nodo.textContent = `$${total}`; });
    if (contador) contador.textContent = articulos.length;

    listas.forEach(lista => {
      lista.innerHTML = '';

      if (articulos.length === 0) {
        const vacio = document.createElement('li');
        vacio.className = 'resumen-orden__vacio';
        vacio.textContent = 'Aún no agregaste nada';
        lista.appendChild(vacio);
        return;
      }

      articulos.forEach(item => {
        const fila = document.createElement('li');
        fila.className = 'fila-orden';
        fila.innerHTML = `<span>${item.nombre}</span><strong>$${item.precio}</strong>`;
        lista.appendChild(fila);
      });
    });
  }

  function agregar(nombre, precio) {
    articulos.push({ nombre, precio: Number(precio) });
    pintar();
  }

  function quitarUltimo() {
    if (articulos.length === 0) return;

    // Animación de salida sobre la última fila de cada lista, antes de re-pintar
    listas.forEach(lista => {
      const filas = lista.querySelectorAll('.fila-orden');
      const ultima = filas[filas.length - 1];
      if (ultima) ultima.classList.add('fila-orden--saliendo');
    });

    setTimeout(() => {
      articulos.pop();
      pintar();
    }, 220);
  }

  function vaciar() {
    articulos = [];
    pintar();
  }

  return { agregar, quitarUltimo, vaciar, pintar };
})();

const Opiniones = (() => {
  let puntuacion = 0;

  const botonesEstrella = Array.from(document.querySelectorAll('.estrella'));
  const formulario = document.getElementById('formulario-opinion');
  const contenedor = document.getElementById('rejilla-opiniones');

  function marcarEstrellas(valor) {
    puntuacion = valor;
    botonesEstrella.forEach(boton => {
      const activa = Number(boton.dataset.puntos) <= valor;
      boton.classList.toggle('estrella--activa', activa);
      boton.setAttribute('aria-checked', String(activa));
    });
  }

  function textoEstrellas(valor) {
    return '★★★★★☆☆☆☆☆'.slice(5 - valor, 10 - valor);
  }

  function crearTarjeta(nombre, texto, valor) {
    const item = document.createElement('li');
    item.className = 'tarjeta-opinion tarjeta-opinion--nueva';
    item.innerHTML = `
      <div class="tarjeta-opinion__calificacion" aria-label="${valor} de 5 estrellas">${textoEstrellas(valor)}</div>
      <p class="tarjeta-opinion__texto">${texto}</p>
      <p class="tarjeta-opinion__autor">${nombre}</p>
    `;
    return item;
  }

  function manejarEnvio(evento) {
    evento.preventDefault();

    const nombre = document.getElementById('campo-nombre').value.trim();
    const texto = document.getElementById('campo-texto').value.trim();

    if (puntuacion === 0) {
      window.alert('Selecciona una calificación con estrellas antes de publicar.');
      return;
    }

    const tarjeta = crearTarjeta(nombre, texto, puntuacion);
    contenedor.prepend(tarjeta);

    formulario.reset();
    marcarEstrellas(0);
  }

  function iniciar() {
    botonesEstrella.forEach(boton => {
      boton.addEventListener('click', () => marcarEstrellas(Number(boton.dataset.puntos)));
    });

    if (formulario) {
      formulario.addEventListener('submit', manejarEnvio);
    }
  }

  return { iniciar };
})();

const PanelesLaterales = (() => {
  const fondo = document.getElementById('fondo-oscurecido');

  function abrir(panel) {
    panel.classList.add('panel-lateral--abierto');
    fondo.classList.add('fondo-oscurecido--visible');
  }

  function cerrarTodos() {
    document.querySelectorAll('.panel-lateral--abierto').forEach(panel => {
      panel.classList.remove('panel-lateral--abierto');
    });
    fondo.classList.remove('fondo-oscurecido--visible');
  }

  function conectar(idBotonAbrir, idPanel, idBotonCerrar) {
    const botonAbrir = document.getElementById(idBotonAbrir);
    const panel = document.getElementById(idPanel);
    const botonCerrar = document.getElementById(idBotonCerrar);

    if (!botonAbrir || !panel) return;

    botonAbrir.addEventListener('click', () => abrir(panel));
    if (botonCerrar) botonCerrar.addEventListener('click', cerrarTodos);
  }

  function iniciar() {
    conectar('abrir-orden', 'panel-orden', 'cerrar-orden');
    conectar('abrir-menu-movil', 'panel-menu-movil', 'cerrar-menu-movil');
    fondo.addEventListener('click', cerrarTodos);

    // Cerrar con tecla Escape
    document.addEventListener('keydown', evento => {
      if (evento.key === 'Escape') cerrarTodos();
    });

    // Los enlaces de navegación dentro del panel móvil también lo cierran
    document.querySelectorAll('.panel-lateral__nav a').forEach(enlace => {
      enlace.addEventListener('click', cerrarTodos);
    });
  }

  return { iniciar };
})();

function iniciarTienda() {
  // Botones "Agregar" del catálogo: leen nombre/precio del propio <li>
  document.querySelectorAll('.boton-agregar').forEach(boton => {
    const tarjeta = boton.closest('.tarjeta-producto');
    boton.addEventListener('click', () => {
      Orden.agregar(tarjeta.dataset.nombre, tarjeta.dataset.precio);
    });
  });

  document.getElementById('quitar-ultimo')?.addEventListener('click', Orden.quitarUltimo);
  document.getElementById('quitar-ultimo-panel')?.addEventListener('click', Orden.quitarUltimo);
  document.getElementById('vaciar-orden')?.addEventListener('click', Orden.vaciar);
  document.getElementById('vaciar-orden-panel')?.addEventListener('click', Orden.vaciar);

  Orden.pintar();
  Opiniones.iniciar();
  PanelesLaterales.iniciar();
}

// El script se carga al final de <body>, así que el DOM ya existe en este punto.
// Aun así, cubrimos el caso en que el documento siga "loading" (carga diferida, caché, etc.)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarTienda);
} else {
  iniciarTienda();
}
