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
        // Ejecuta todas las consultas en paralelo
        const [{ data: categories, error: categoriesError }, 
               { data: types, error: typesError }, 
               { data: difficulties, error: difficultiesError }, 
               { data: trivia, error: triviaError }] = await Promise.all([
            supabase.from('category').select('*'),
            supabase.from('type').select('*'),
            supabase.from('difficulty').select('*'),
            supabase.from('trivia').select('*, category(description), type(description), difficulty(description)').eq('status', 1)
        ]);

        // Manejo de errores
        if (categoriesError || typesError || difficultiesError || triviaError) {
            throw new Error('Error al obtener los datos');
        }

        // Llenar los selects
        populateSelect('category', categories || [], 'Seleccione una categoría');
        populateSelect('type', types || [], 'Selecciona un tipo');
        populateSelect('difficulty', difficulties || [], 'Selecciona la dificultad');

        // Inicializar o limpiar DataTable
        let table = $('#triviasTable').DataTable({
            responsive: true,
            autoWidth: false,
        });
        table.clear();

        // Agregar filas a la tabla
        (trivia || []).forEach(triviaItem => {
            const style = triviaItem.type?.description != 'multiple' ? "bg-info" : 'bg-success';
            let style_difficulty='';
            switch(triviaItem.difficulty?.description){
                case 'Easy':
                    style_difficulty='bg-primary';
                    break;
                case 'Normal':
                    style_difficulty='bg-warning';
                    break;
                case 'Hard':
                    style_difficulty='bg-danger';
                    break;
            }
            table.row.add([
                triviaItem.question || "Sin pregunta",
                triviaItem.category?.description || "Sin categoría",
                triviaItem.options || "Sin opciones",
                triviaItem.correct_answer || "Sin respuesta",
                `<span class="badge ${style} text-capitalize">${triviaItem.type?.description || "Sin tipo"}</span>`,
                `<span class="badge ${style_difficulty} text-capitalize">${triviaItem.difficulty?.description || "Sin dificultad"}</span>`,
                `<div class="d-flex align-items-center"><a href="javascript:;" class="text-body mx-2" onclick="editTrivia(${triviaItem.id})">
                    <i class="fa-solid fa-pen-to-square"></i>
                 </a>
                 <a href="javascript:;" class="text-body" onclick="deleteTrivia(${triviaItem.id})">
                    <i class="fa-solid fa-trash"></i>
                 </a></div>`
            ]);
        });

        // Dibujar la tabla con los nuevos datos
        table.draw();
    } catch (error) {
        console.error('Error al cargar los datos:', error.message);
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
    const categoryId = document.getElementById("category").value;
    const typeId = document.getElementById("type").value;
    const difficultyId = document.getElementById("difficulty").value;
    let respuesta = '';
    let opciones=[];

    $('input[name="inputSelection"]:checked').each(function() {
        respuesta = $('#' + $(this).val()).val();
    });
    $('input[name="opcion"]').each(function() {
        opciones.push($(this).val()); 
    });

    console.log(respuesta); console.log(opciones);
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
    document.getElementById('category').value = data.category;
    document.getElementById('difficulty').value = data.difficulty;
    document.getElementById('type').value = data.type;
    
    changeOptions(data.type, data.options, data.correct_answer);
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
    const categoryId = document.getElementById("category").value;
    const typeId = document.getElementById("type").value;
    const difficultyId = document.getElementById("difficulty").value;
    let respuesta = '';
    let opciones=[];
    $('input[name="inputSelection"]:checked').each(function() {
        respuesta = $('#' + $(this).val()).val();
    });
    $('input[name="opcion"]').each(function() {
        opciones.push($(this).val()); 
    });
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
    $('#type').on('change', function(event) {
        changeOptions($(this).val());
    });
});
document.getElementById("toggleDarkMode").addEventListener("click", () => {
    // Cambiar el tema (oscuro o claro)
    document.body.classList.toggle("dark-mode");

    // Obtener el ícono
    const themeIcon = document.getElementById("themeIcon");
    const table = document.getElementById("triviasTable");
    // Comprobar si estamos en modo oscuro
    const isDarkMode = document.body.classList.contains("dark-mode");

    // Cambiar el ícono según el tema
    if (isDarkMode) {
        themeIcon.classList.remove("fa-moon");  // Eliminar luna
        themeIcon.classList.add("fa-sun");      // Agregar sol
        table.classList.add('table-dark');
    } else {
        themeIcon.classList.remove("fa-sun");   // Eliminar sol
        themeIcon.classList.add("fa-moon");     // Agregar luna
        table.classList.remove('table-dark');
    }
});

function changeOptions(type, options = null, correct_answer = null) {
    const $container = $('#container-options');
    $container.empty(); // Limpiar el contenido del div
    let inputs = '';

    // Función para verificar si una opción es la correcta
    const checkCorrectAnswer = (optionValue) => {
        // Verificamos si options y correct_answer no son null
        if (options && correct_answer) {
            return optionValue === correct_answer ? 'checked' : '';
        }
        return ''; // Si alguno es null, no marcamos ninguna opción
    };

    switch (parseInt(type)) {
        case 1:
            inputs = `
            <div class="row"> 
                    <div class="col-6">
                        <label for="opcion1">Opción 1:</label>
                        <input type="text" id="opcion1" name="opcion" value="${options ? options[0] : ''}">
                        <input type="radio" name="inputSelection" value="opcion1" ${checkCorrectAnswer(options ? options[0] : '')}>
                    </div>
                    <div class="col-6">
                        <label for="opcion2">Opción 2:</label>
                        <input type="text" id="opcion2" name="opcion" value="${options ? options[1] : ''}">
                        <input type="radio" name="inputSelection" value="opcion2" ${checkCorrectAnswer(options ? options[1] : '')}>
                    </div>
                </div>
                <div class="row"> 
                    <div class="col-6">
                        <label for="opcion3">Opción 3:</label>
                        <input type="text" id="opcion3" name="opcion" value="${options ? options[2] : ''}">
                        <input type="radio" name="inputSelection" value="opcion3" ${checkCorrectAnswer(options ? options[2] : '')}>
                    </div>
                    <div class="col-6">
                        <label for="opcion4">Opción 4:</label>
                        <input type="text" id="opcion4" name="opcion" value="${options ? options[3] : ''}">
                        <input type="radio" name="inputSelection" value="opcion4" ${checkCorrectAnswer(options ? options[3] : '')}>
                    </div>
                </div>
            `;
            break;
        case 2:
            inputs = `
            <div class="row"> 
                <div class="col-6">
                    <label for="opcion1">Opción 1:</label>
                    <input type="text" id="opcion1" name="opcion" value="${options ? options[0] : ''}">
                    <input type="radio" name="inputSelection" value="opcion1" ${checkCorrectAnswer(options ? options[0] : '')}>
                </div>
                <div class="col-6">
                    <label for="opcion2">Opción 2:</label>
                    <input type="text" id="opcion2" name="opcion" value="${options ? options[1] : ''}">
                    <input type="radio" name="inputSelection" value="opcion2" ${checkCorrectAnswer(options ? options[1] : '')}>
                </div>
            </div>
            `;
            break;
    }

    $container.append(inputs);
}






