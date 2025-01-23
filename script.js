const SUPABASE_URL = "https://lckjwmlqwzhfhlpjbmaj.supabase.co";
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxja2p3bWxxd3poZmhscGpibWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NzUxNDQsImV4cCI6MjA1MzE1MTE0NH0.SgfHhGG9oDQWrO-5pF5OY2W_Y9HpZhHK3IB80bTBhN0";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_API_KEY);

// Función general para poblar select
function populateSelect(selectId, data, defaultOptionText) {
    const select = document.getElementById(selectId);
    select.innerHTML = ''; // Limpiar el select

    const defaultOption = document.createElement("option");
    defaultOption.textContent = defaultOptionText;
    defaultOption.value = "";
    select.appendChild(defaultOption);

    data.forEach(item => {
        const option = document.createElement("option");
        option.textContent = item.description;
        option.value = item.id;
        select.appendChild(option);
    });
}

// Obtener categorías, tipos, dificultades y trivias
async function fetchData() {
    try {
        const [categories, types, difficulties, trivia] = await Promise.all([
            supabase.from('category').select('*'),
            supabase.from('type').select('*'),
            supabase.from('difficulty').select('*'),
            supabase.from('trivia').select('*, category(description), type(description), difficulty(description)').eq('status', 1)
        ]);

        if (categories.error || types.error || difficulties.error || trivia.error) {
            throw new Error('Error al obtener los datos');
        }

        populateSelect('category', categories.data, 'Seleccione una categoría');
        populateSelect('type', types.data, 'Selecciona un tipo');
        populateSelect('difficulty', difficulties.data, 'Selecciona la dificultad');

        let table = $('#triviasTable').DataTable();
        table.clear();
        trivia.data.forEach(triviaItem => {
            table.row.add([
                triviaItem.question,
                triviaItem.category?.description || "Sin categoría",
                triviaItem.options,
                triviaItem.correct_answer,
                triviaItem.type?.description || "Sin tipo",
                triviaItem.difficulty?.description || "Sin dificultad",
                `<button class="btn btn-warning btn-sm" onclick="editTrivia(${triviaItem.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                 <button class="btn btn-danger btn-sm" onclick="deleteTrivia(${triviaItem.id})"><i class="fa-solid fa-trash"></i></button>` // Botones de acción
            ]);
        });
        table.draw();
    } catch (error) {
        console.error('Error al cargar los datos: ', error.message);
    }
}

// Función para agregar nueva categoría
async function addCategory() {
    const category = document.getElementById('newCategory').value;
    if (!category) {
        Swal.fire('Error', 'Por favor, ingresa una categoría.', 'error');
        return;
    }

    const { data, error } = await supabase.from('category').insert([{ description: category }]);
    if (error) {
        Swal.fire('Error', 'Error al insertar: ' + error.message, 'error');
        return;
    }

    Swal.fire('Éxito', 'Categoría agregada con éxito!', 'success');
    fetchData();  // Recargar los datos
    $('#categoryModal').modal('hide'); // Cerrar el modal
}

// Agregar nueva trivia
async function addTrivia() {
    const pregunta = document.getElementById("pregunta").value;
    const opciones = document.getElementById("opciones").value.split(",").map(o => o.trim());
    const respuesta = document.getElementById("respuesta").value;
    const categoryId = document.getElementById("category").value;
    const typeId = document.getElementById("type").value;
    const difficultyId = document.getElementById("difficulty").value;


    if (!pregunta || opciones.length < 2 || !respuesta || !categoryId || !typeId) {
        Swal.fire('Error', 'Completa todos los campos correctamente.', 'error');
        return;
    }

    const nuevaTrivia = {
        category: categoryId,
        question: pregunta,
        options: opciones,
        correct_answer: respuesta,
        type: typeId,
        difficulty: difficultyId,
        status: 1
    };

    const { data, error } = await supabase.from('trivia').insert([nuevaTrivia]);
    if (error) {
        Swal.fire('Error', 'Error al insertar: ' + error.message, 'error');
        return;
    }

    Swal.fire('Éxito', 'Trivia agregada con éxito!', 'success');
    fetchData();  // Recargar los datos
    $('#triviaModal').modal('hide'); // Cerrar el modal
}

// Editar trivia
async function editTrivia(id) {
    // Obtener el registro de trivia
    const { data, error } = await supabase.from('trivia').select('*').eq('id', id).single();
    if (error) {
        Swal.fire('Error', 'No se pudo obtener la trivia.', 'error');
        return;
    }

    // Rellenar los campos del modal con los datos existentes
    document.getElementById('pregunta').value = data.question;
    document.getElementById('opciones').value = data.options.join(", ");
    document.getElementById('respuesta').value = data.correct_answer;
    document.getElementById('category').value = data.category;
    document.getElementById('type').value = data.type;
    document.getElementById('difficulty').value = data.difficulty;

    // Cambiar el texto y el comportamiento del botón
    const saveButton = document.querySelector('#triviaModal .btn-primary');
    saveButton.innerHTML = 'Guardar Cambios';
    saveButton.setAttribute('onclick', `saveEditedTrivia(${id})`);

    // Guardar el ID de la trivia que estamos editando
    currentEditingTriviaId = id;

    // Mostrar el modal
    $('#triviaModal').modal('show');
}

// Guardar los cambios de la trivia editada
async function saveEditedTrivia(id) {
    const pregunta = document.getElementById("pregunta").value;
    const opciones = document.getElementById("opciones").value.split(",").map(o => o.trim());
    const respuesta = document.getElementById("respuesta").value;
    const categoryId = document.getElementById("category").value;
    const typeId = document.getElementById("type").value;
    const difficultyId = document.getElementById("difficulty").value;

    // Asegúrate de que estos campos no sean nulos o vacíos
    if (!pregunta || !opciones || !respuesta || !categoryId || !typeId) {
        Swal.fire('Error', 'Por favor completa todos los campos correctamente.', 'error');
        return;
    }

    const updatedTrivia = {
        question: pregunta,
        options: opciones,
        correct_answer: respuesta,
        category: categoryId,
        type: typeId,
        difficulty: difficultyId
    };

    const { data, error } = await supabase.from('trivia').update(updatedTrivia).eq('id', id);
    if (error) {
        Swal.fire('Error', 'Error al actualizar: ' + error.message, 'error');
        return;
    }
    console.log(data);
    Swal.fire('Éxito', 'Trivia actualizada con éxito!', 'success');
    fetchData();  // Recargar los datos
    $('#triviaModal').modal('hide'); // Cerrar el modal

    // Limpiar el ID de la trivia que estamos editando
    currentEditingTriviaId = null;
}

// Eliminar trivia
async function deleteTrivia(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: 'No podrás recuperar esta trivia!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            // Realizar la baja lógica actualizando el status a 0
            const { data, error } = await supabase.from('trivia').update({ status: 0 }).eq('id', id);
            if (error) {
                Swal.fire('Error', 'No se pudo actualizar el estado de la trivia.', 'error');
                return;
            }

            Swal.fire('Eliminado!', 'La trivia ha sido desactivada.', 'success');
            fetchData();  // Recargar los datos
        }
    });
}

// Llamadas iniciales para cargar los datos
$(document).ready(() => {
    fetchData();
});
document.getElementById("toggleDarkMode").addEventListener("click", () => {
    // Cambiar el tema (oscuro o claro)
    document.body.classList.toggle("dark-mode");

    // Obtener el ícono
    const themeIcon = document.getElementById("themeIcon");

    // Comprobar si estamos en modo oscuro
    const isDarkMode = document.body.classList.contains("dark-mode");

    // Cambiar el ícono según el tema
    if (isDarkMode) {
        themeIcon.classList.remove("fa-moon");  // Eliminar luna
        themeIcon.classList.add("fa-sun");      // Agregar sol
    } else {
        themeIcon.classList.remove("fa-sun");   // Eliminar sol
        themeIcon.classList.add("fa-moon");     // Agregar luna
    }

    // Mostrar el cambio con SweetAlert
    const currentMode = isDarkMode ? "modo oscuro" : "modo claro";
    Swal.fire(`Modo cambiado a ${currentMode}`);
});

