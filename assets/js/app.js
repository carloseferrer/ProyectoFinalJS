document.addEventListener("DOMContentLoaded", function () {
  const clientesSelect = document.getElementById("clientesSelect");
  const clientesTableBody = document.getElementById("clientesTableBody");
  const datosTableBody = document.getElementById("datosTableBody");

  // Función para agregar un nuevo cliente
  function addCliente(event) {
    event.preventDefault();

    const formData = new FormData(clienteForm);
    const data = {
      nombre: formData.get("nombre"),
      email: formData.get("email"),
      cedula: formData.get("cedula"),
      telefono: formData.get("telefono"),
    };

    fetch("/saveCliente", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else if (response.status === 400) {
          // Si hay un error de datos duplicados, mostramos el mensaje de error en el frontend
          response.json().then((errorData) => {
            if (errorData.message.includes("correo")) {
              showError(
                "El correo ingresado ya se encuentra registrado!, debes ingresar otro"
              );
            } else if (errorData.message.includes("cédula")) {
              showError(
                "La cédula ingresada ya se encuentra registrada!, debes usar otra"
              );
            } else if (errorData.message.includes("telefono")) {
              showError(
                "El telefono ingresado ya se encuentra registrado!, debes usar otro"
              );
            } else {
              showError("Error al guardar datos del cliente");
            }
          });
        } else {
          throw new Error("Error al guardar datos del cliente");
        }
      })
      .then((newCliente) => {
        // Limpiar el formulario y actualizar la tabla con el nuevo cliente
        clienteForm.reset();
        showClientes();
      })
      .catch((error) => console.error(error));
  }

  // Función para mostrar el mensaje de error en el frontend
  function showError(message) {
    const errorMessageElement = document.getElementById("errorMessage");
    errorMessageElement.textContent = message;
    errorMessageElement.classList.remove("d-none");
    setTimeout(() => {
      errorMessageElement.textContent = "";
      errorMessageElement.classList.add("d-none");
    }, 6000);
  }

  // Input donde se mostrará la cédula del cliente seleccionado
  const cedulaClienteInput = document.getElementById("cedulaCliente");

  // Función para cargar las opciones de clientes en el select
  function loadClientes() {
    fetch("/getClientes")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al obtener datos de los clientes");
        }
        return response.json();
      })
      .then((clientes) => {
        clientes.forEach((cliente) => {
          const option = document.createElement("option");
          option.value = cliente._id; // Si el campo _id es de tipo ObjectId, es posible que necesites convertirlo a cadena
          option.textContent = cliente.nombre;
          clientesSelect.appendChild(option);
        });
      })
      .catch((error) => console.error(error));
  }

  // Función para obtener y mostrar la cédula del cliente seleccionado
  function obtenerCedulaCliente() {
    const clienteId = clientesSelect.value;
    console.log("Cliente seleccionado:", clienteId);

    // Hacer una petición al servidor para obtener la cédula del cliente por su ID
    fetch(`/getClienteById/${clienteId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al obtener la cédula del cliente");
        }
        return response.json();
      })
      .then((cliente) => {
        console.log("Cédula del cliente:", cliente.cedula);
        // Asignar la cédula del cliente al input correspondiente
        cedulaClienteInput.value = cliente.cedula;
      })
      .catch((error) => console.error(error));
  }

  if (clientesSelect) {
    // Evento del select para obtener la cédula del cliente seleccionado
    clientesSelect.addEventListener("change", obtenerCedulaCliente);
    // Verificar si el evento de cambio en el select está funcionando correctamente
    clientesSelect.addEventListener("change", function () {
      console.log("Cliente seleccionado:", clientesSelect.value);
    });
  }

  // Cargar los clientes al cargar la página
  loadClientes();

  // Evento del formulario para agregar un nuevo cliente (solo en index.html)
  const clienteForm = document.getElementById("clienteForm");
  if (clienteForm) {
    clienteForm.addEventListener("submit", addCliente);
  }

  // Función para eliminar un cliente
  function deleteCliente(clienteId) {
    console.log("clienteId a eliminar:", clienteId);
    const confirmDelete = window.confirm("¿Estás seguro de eliminar este cliente y sus mantenimientos registrados?");
    if (confirmDelete){
      fetch(`/deleteCliente/${clienteId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Error al eliminar cliente");
        })
        .then((data) => {
          console.log("Cliente eliminado:", data);
          // Luego de eliminar el cliente, también eliminamos los datos de mantenimiento
          deleteDatosPorClienteId(clienteId);
          showClientes();
        })
        .catch((error) => console.error(error));
    }
  }

  // Función para eliminar los datos de mantenimiento relacionados con el cliente
  function deleteDatosPorClienteId(clienteId) {
    fetch(`/deleteDatosByClienteId/${clienteId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Error al eliminar datos de mantenimiento");
      })
      .then((data) => {
        console.log("Datos de mantenimiento eliminados:", data);
        // Después de eliminar los datos, actualizamos la tabla de datos
        showDatos();
      })
      .catch((error) => console.error(error));
  }

  // Función para eliminar datos de mantenimiento por su ID
  function deleteDatos(datoId) {
    console.log("datoId a eliminar:", datoId);
    const confirmDelete = window.confirm("¿Estás seguro de eliminar estos datos de mantenimiento?");
    if(confirmDelete){
      fetch(`/deleteDatos/${datoId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Error al eliminar datos de mantenimiento");
        })
        .then((data) => {
          console.log("Datos de mantenimiento eliminados:", data);
          // Después de eliminar los datos, actualizamos la tabla de datos
          showDatos();
        })
        .catch((error) => console.error(error));
    }
  }

  // Función para mostrar los datos de los clientes en la tabla
  function showClientes() {
    fetch("/getClientes")
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Error al obtener datos de los clientes");
      })
      .then((data) => {
        // Limpiar la tabla antes de agregar los nuevos datos
        clientesTableBody.innerHTML = "";

        data.forEach((cliente) => {
          const row = clientesTableBody.insertRow();
          row.insertCell().textContent = cliente.nombre;
          row.insertCell().textContent = cliente.email;
          row.insertCell().textContent = cliente.cedula;
          row.insertCell().textContent = cliente.telefono;

          // Celda para los botones de edición y eliminar
          const actionsCell = row.insertCell();

          // Crear contenedor para los iconos
          const iconsContainer = document.createElement("div");
          iconsContainer.style.display = "flex";
          iconsContainer.style.justifyContent = "center";


          // Icono de eliminar
          const deleteIcon = document.createElement("i");
          deleteIcon.classList.add("fas", "fa-trash");
          deleteIcon.style.color = "#ff0000";
          deleteIcon.style.cursor = "pointer";
          deleteIcon.addEventListener("click", () =>
            deleteCliente(cliente._id)
          );
          iconsContainer.appendChild(deleteIcon);

          // Agregar contenedor con ambos iconos a la celda de acciones
          actionsCell.appendChild(iconsContainer);
        });
      })
      .catch((error) => console.error(error));
  }

  // Obtener y mostrar los datos de los clientes al cargar la página
  showClientes();

  // Función para agregar los datos de mantenimiento de vehículos
  function addDatos(event) {
    event.preventDefault();

    const datosForm = document.getElementById("datosForm");
    const formData = new FormData(datosForm);
    const clienteId = clientesSelect.value;
    const nombreCliente =
      clientesSelect.options[clientesSelect.selectedIndex].text;
    // Convertir la placa a mayúsculas
    const placa = formData.get("placa").toUpperCase();
    const data = {
      clienteId: clienteId, // Referencia al cliente mediante su _id
      nombreCliente: nombreCliente,
      cedulaCliente: formData.get("cedulaCliente"),
      marca: formData.get("marca"),
      placa: placa,
      tipoMantenimiento: formData.get("tipoMantenimiento"),
      nombreMecanico: formData.get("nombreMecanico"),
    };

    console.log("Datos a enviar:", data);

    fetch("/saveDatos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else if (response.status === 400) {
          // Si hay un error de datos duplicados, mostramos el mensaje de error en el frontend
          response.json().then((errorPlaca) => {
            if (errorPlaca.message.includes("vehiculo")) {
              showErrorPlaca(
                "El vehiculo ingresado ya se encuentra registrado!, debes ingresar otro"
              );
            } else {
              showErrorPlaca("Error al guardar datos de mantenimiento");
            }
          });
        } else {
          throw new Error("Error al guardar datos de mantenimiento");
        }
      })
      .then((newDatos) => {
        // Limpiar el formulario después de guardar los datos
        datosForm.reset();
        // Mostrar una alerta o mensaje de éxito si es necesario
        showDatos();
        console.log("Datos ingresados en la bdd", newDatos);
      })
      .catch((error) => console.error(error));
  }

  // Función para mostrar el mensaje de error en el frontend de la placa
  function showErrorPlaca(message) {
    const errorMessageElement = document.getElementById("errorMessagePlaca");
    errorMessageElement.textContent = message;
    errorMessageElement.classList.remove("d-none");
    setTimeout(() => {
      errorMessageElement.textContent = "";
      errorMessageElement.classList.add("d-none");
    }, 6000);
  }

  // Función para mostrar los datos de mantenimiento en la tabla de datos.html
  function showDatos() {
    fetch("/getDatos")
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Error al obtener datos de mantenimiento");
      })
      .then((data) => {
        // Limpiar la tabla antes de agregar los nuevos datos
        datosTableBody.innerHTML = "";
        console.log("Datos recibidos del servidor:", data);
        data.forEach((dato) => {
          const row = datosTableBody.insertRow();
          row.insertCell().textContent = dato.nombreCliente;
          row.insertCell().textContent = dato.cedulaCliente;
          row.insertCell().textContent = dato.marca;
          row.insertCell().textContent = dato.placa;
          row.insertCell().textContent = dato.tipoMantenimiento;
          row.insertCell().textContent = dato.nombreMecanico;
          // Celda para los botones de edición y eliminar
          const actionsCell = row.insertCell();

          // Crear contenedor para los iconos
          const iconsContainer = document.createElement("div");
          iconsContainer.style.display = "flex";
          iconsContainer.style.justifyContent = "center";

          // Icono de eliminar
          const deleteIcon = document.createElement("i");
          deleteIcon.classList.add("fas", "fa-trash");
          deleteIcon.style.color = "#ff0000";
          deleteIcon.style.cursor = "pointer";
          deleteIcon.addEventListener("click", () =>
            deleteDatos(dato._id)
          );
          iconsContainer.appendChild(deleteIcon);

          // Agregar contenedor con ambos iconos a la celda de acciones
          actionsCell.appendChild(iconsContainer);
        });
      })
      .catch((error) => console.error(error));
  }

  const datosForm = document.getElementById("datosForm");
  if (datosForm) {
    datosForm.addEventListener("submit", addDatos);
  }

  // Obtener y mostrar los datos de mantenimiento al cargar la página
  showDatos(); // Agregamos esta línea
});
