export const AlertasSemiliologia = {
    temperatura: [35, 35.9, 37.2, 38],
    freqCardiaca: [40, 49, 99, 119],
    freqRespiratoria: [10, 11, 24, 29],
    saturacao: [85, 89, 97, 99],
    presArtSistolica: [80, 99, 129, 139],
    presArtDiastolica: [50, 69, 89, 99],
};

export const mensagemAlertaSemiologia = (idoso, data, funcionario, alertas) => {
    const mensagem = [
        '*Alerta - Sinais Vitais* \n\n',
        `Idoso: ${idoso} \n`,
        `Data: ${data} \n`,
        `Responsável: ${funcionario} \n\n`,
        alertas.join('\n'),
    ];
    return mensagem.join('');
};

export function medicao(idoso, data, funcionario, temperatura, freqCardiaca, freqRespiratoria, saturacao, presArtSistolica, presArtDiastolica) {
    let arrayAlerta = [];

    const tiposMedidas = Object.keys(AlertasSemiliologia);

    tiposMedidas.forEach(medida => {
        const valorAtual = parseFloat(eval(medida)); // Usamos eval aqui para acessar dinamicamente o valor da variável correspondente
        const limites = AlertasSemiliologia[medida];
        if (valorAtual < limites[0] || valorAtual > limites[3]) {
            arrayAlerta.push(`${medida} - ${valorAtual}`);
        }
    });

    if (arrayAlerta.length > 0) {
        const mensagemFinal = mensagemAlertaSemiologia(idoso, data, funcionario, arrayAlerta);
        return mensagemFinal
    } else {
        return false
    }
}

// Exemplo de uso:
// medicao('Idoso A', '2024-07-19', 'Funcionário X', 36, 50, 25, 90, 85, 55);
