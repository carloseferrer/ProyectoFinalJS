// server.js
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 4000;

const path = require("path");

const dbUri =
  "mongodb+srv://carlosferrerdev:Wr0liCSABFjvfEQ7@tallerjohndoe.agbgh8d.mongodb.net/mi_crud_db?retryWrites=true&w=majority";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let db; // Variable para almacenar la conexión a la base de datos

// Conexión a la base de datos
async function connectDB() {
  try {
    const client = await MongoClient.connect(dbUri, {
      useUnifiedTopology: true,
    });
    db = client.db("mi_crud_db"); // Nombre de tu base de datos "mi_crud_db"
    console.log("Conexión exitosa a MongoDB Atlas");
  } catch (err) {
    console.error("Error al conectar a MongoDB Atlas:", err);
    process.exit(1); // Detener la aplicación en caso de error
  }
}

// Configurar la carpeta 'assets' para servir archivos estáticos
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Ruta GET para el archivo index.html (ubicado en la raíz)
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Ruta GET para el archivo datos.html
app.get("/datos", function (req, res) {
  res.sendFile(path.join(__dirname, "datos.html"));
});

// Ruta POST para guardar los datos del cliente
app.post("/saveCliente", async function (req, res) {
  try {
    const cliente = {
      nombre: req.body.nombre,
      email: req.body.email,
      cedula: req.body.cedula,
      telefono: req.body.telefono,
    };

    // Validar si el correo o la cédula ya existen en la base de datos
    const existingEmail = await db
      .collection("clientes")
      .findOne({ email: cliente.email });
    const existingCedula = await db
      .collection("clientes")
      .findOne({ cedula: cliente.cedula });
    const existingTelefono = await db
      .collection("clientes")
      .findOne({ telefono: cliente.telefono });

    if (existingEmail) {
      // Si el correo ya existe, enviamos un mensaje de error al frontend
      return res.status(400).json({
        message:
          "El correo ingresado ya se encuentra registrado!, debes ingresar otro",
      });
    }

    if (existingCedula) {
      // Si la cédula ya existe, enviamos un mensaje de error al frontend
      return res.status(400).json({
        message:
          "La cédula ingresada ya se encuentra registrada!, debes usar otra",
      });
    }

    if (existingTelefono) {
      // Si el telefono ya existe, enviamos un mensaje de error al frontend
      return res.status(400).json({
        message:
          "El telefono ingresado ya se encuentra registrado!, debes usar otro",
      });
    }

    // Si no hay errores, procedemos a insertar el cliente en la base de datos
    await db.collection("clientes").insertOne(cliente);
    console.log("Cliente insertado:", cliente);
    res.json(cliente);
  } catch (err) {
    console.error("Error al guardar datos del cliente:", err);
    res.status(500).send("Error al guardar datos del cliente");
  }
});

// Ruta GET para obtener los nombres de todos los clientes
app.get("/getClientes", async function (req, res) {
  try {
    const clientes = await db.collection("clientes").find({}).toArray();
    console.log("Clientes obtenidos:", clientes);
    res.json(clientes); // Respuesta con los datos de los clientes en formato JSON
  } catch (err) {
    console.error("Error al obtener datos de los clientes:", err);
    res.status(500).send("Error al obtener datos de los clientes");
  }
});

// Ruta GET para obtener los datos de un cliente por su ID
app.get("/getClienteById/:id", async function (req, res) {
  try {
    const clienteId = req.params.id;
    console.log("Obteniendo cliente con ID:", clienteId);
    const objectIdClienteId = new ObjectId(clienteId); // Utilizamos el operador 'new' para crear una instancia de ObjectId

    const cliente = await db
      .collection("clientes")
      .findOne({ _id: objectIdClienteId });

    if (!cliente) {
      throw new Error("Cliente no encontrado");
    }

    // Obtener la cédula del cliente por su ID
    const cedulaCliente = await db
      .collection("clientes")
      .findOne({ _id: objectIdClienteId }, { projection: { cedula: 1 } });

    cliente.cedula = cedulaCliente.cedula;

    console.log("Cliente encontrado:", cliente);
    res.json(cliente);
  } catch (err) {
    console.error("Error al obtener datos del cliente:", err);
    res.status(500).json({ error: "Error al obtener datos del cliente" });
  }
});

// Ruta DELETE para eliminar un cliente por su ID
app.delete("/deleteCliente/:id", async function (req, res) {
  try {
    const clienteId = req.params.id;
    // Eliminar el cliente por su ID
    await db.collection("clientes").deleteOne({ _id: new ObjectId(clienteId) });
    console.log("Cliente eliminado:", clienteId);

    // Ahora eliminamos los datos de mantenimiento relacionados con el cliente
    await db.collection("datos").deleteMany({ clienteId: clienteId });
    console.log(
      "Datos de mantenimiento eliminados para el cliente:",
      clienteId
    );

    res.json({
      message: "Cliente y sus datos de mantenimiento eliminados exitosamente",
    });
  } catch (err) {
    console.error(
      "Error al eliminar cliente y sus datos de mantenimiento:",
      err
    );
    res
      .status(500)
      .json({
        message: "Error al eliminar cliente y sus datos de mantenimiento",
      });
  }
});

// Ruta DELETE para eliminar datos de mantenimiento por el clienteId
app.delete("/deleteDatosByClienteId/:clienteId", async function (req, res) {
  try {
    const clienteId = req.params.clienteId;
    // Eliminar los datos de mantenimiento por el clienteId
    await db.collection("datos").deleteMany({ clienteId: clienteId });
    console.log("Cliente eliminado:", clienteId);
    console.log(
      "Datos de mantenimiento eliminados para el cliente:",
      clienteId
    );
    res.json({ message: "Datos de mantenimiento eliminados exitosamente" });
  } catch (err) {
    console.error(
      "Error al eliminar datos de mantenimiento por clienteId:",
      err
    );
    res
      .status(500)
      .json({
        message: "Error al eliminar datos de mantenimiento por clienteId",
      });
  }
});

// Ruta POST para guardar los datos de mantenimiento de vehículos
app.post("/saveDatos", async function (req, res) {
  try {
    const datos = {
      clienteId: req.body.clienteId,
      nombreCliente: req.body.nombreCliente,
      cedulaCliente: req.body.cedulaCliente,
      marca: req.body.marca,
      placa: req.body.placa,
      tipoMantenimiento: req.body.tipoMantenimiento,
      nombreMecanico: req.body.nombreMecanico,
    };

    // Validar si la placa existe en la base de datos
    const existingPlaca = await db
      .collection("datos")
      .findOne({ placa: datos.placa });

    if (existingPlaca) {
      // Si la placa ya existe, enviamos un mensaje de error al frontend
      return res.status(400).json({
        message:
          "El vehiculo ingresado ya se encuentra registrado, debes ingresar otro",
      });
    }

    console.log("Datos recibidos en el servidor:", datos); // Agregamos este console.log
    await db.collection("datos").insertOne(datos);
    console.log("Datos de mantenimiento insertados:", datos);
    res.json(datos);
  } catch (err) {
    console.error("Error al guardar datos de mantenimiento:", err);
    res.status(500).send("Error al guardar datos de mantenimiento");
  }
});

// Ruta DELETE para eliminar un dato de mantenimiento por su ID
app.delete("/deleteDatos/:id", async function (req, res) {
  try {
    const datoId = req.params.id;
    // Eliminar el dato de mantenimiento por su ID
    await db.collection("datos").deleteOne({ _id: new ObjectId(datoId) });
    console.log("Dato de mantenimiento eliminado:", datoId);
    res.json({ message: "Dato de mantenimiento eliminado exitosamente" });
  } catch (err) {
    console.error("Error al eliminar dato de mantenimiento:", err);
    res
      .status(500)
      .json({ message: "Error al eliminar dato de mantenimiento" });
  }
});

// Ruta GET para obtener los datos de mantenimiento
app.get("/getDatos", async function (req, res) {
  try {
    const datos = await db.collection("datos").find({}).toArray();
    console.log("Datos de mantenimiento obtenidos:", datos);
    res.json(datos);
  } catch (err) {
    console.error("Error al obtener datos de mantenimiento:", err);
    res.status(500).send("Error al obtener datos de mantenimiento");
  }
});

// Iniciar la conexión a la base de datos y luego iniciar el servidor
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Aplicación alojada en http://localhost:${port}`);
    });
  })
  .catch(console.dir);
