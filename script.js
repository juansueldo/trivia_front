export default function changeOptions(type, options = [], correct_answer = null) {
    const $container = $('#container-options');
    $container.empty(); 
    let inputs = '';

    // Función para obtener el valor de la opción sin errores
    const getOptionValue = (index) => options?.[index] ?? '';

    // Función para verificar si la opción es la correcta
    const checkCorrectAnswer = (optionValue) => {
        return correct_answer !== null && String(optionValue) === String(correct_answer) ? 'checked' : '';
    };

    switch (parseInt(type)) {
        case 1:
            inputs = `
            <div class="row"> 
                    <div class="col-6">
                        <label for="opcion1">Opción 1:</label>
                        <input type="text" id="opcion1" name="opcion" value="${getOptionValue(0)}">
                        <input type="radio" name="inputSelection" value="${getOptionValue(0)}" ${checkCorrectAnswer(getOptionValue(0))}>
                    </div>
                    <div class="col-6">
                        <label for="opcion2">Opción 2:</label>
                        <input type="text" id="opcion2" name="opcion" value="${getOptionValue(1)}">
                        <input type="radio" name="inputSelection" value="${getOptionValue(1)}" ${checkCorrectAnswer(getOptionValue(1))}>
                    </div>
                </div>
                <div class="row"> 
                    <div class="col-6">
                        <label for="opcion3">Opción 3:</label>
                        <input type="text" id="opcion3" name="opcion" value="${getOptionValue(2)}">
                        <input type="radio" name="inputSelection" value="${getOptionValue(2)}" ${checkCorrectAnswer(getOptionValue(2))}>
                    </div>
                    <div class="col-6">
                        <label for="opcion4">Opción 4:</label>
                        <input type="text" id="opcion4" name="opcion" value="${getOptionValue(3)}">
                        <input type="radio" name="inputSelection" value="${getOptionValue(3)}" ${checkCorrectAnswer(getOptionValue(3))}>
                    </div>
                </div>
            `;
            break;
        case 2:
            inputs = `
            <div class="row"> 
                <div class="col-6">
                    <label for="opcion1">Opción 1:</label>
                    <input type="text" id="opcion1" name="opcion" value="${getOptionValue(0)}">
                    <input type="radio" name="inputSelection" value="${getOptionValue(0)}" ${checkCorrectAnswer(getOptionValue(0))}>
                </div>
                <div class="col-6">
                    <label for="opcion2">Opción 2:</label>
                    <input type="text" id="opcion2" name="opcion" value="${getOptionValue(1)}">
                    <input type="radio" name="inputSelection" value="${getOptionValue(1)}" ${checkCorrectAnswer(getOptionValue(1))}>
                </div>
            </div>
            `;
            break;
    }

    $container.append(inputs);
}
