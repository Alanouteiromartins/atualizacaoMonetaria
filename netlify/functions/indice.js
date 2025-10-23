export async function handler(event, context) {
  try {
    const params = event.queryStringParameters;
    const codigo = params.codigo;
    const dataInicial = params.dataInicial;
    const dataFinal = params.dataFinal;

    if (!codigo || !dataInicial || !dataFinal) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Parâmetros obrigatórios ausentes." }),
      };
    }

    // 🔹 Constrói a URL no formato correto (DD/MM/YYYY)
    const formatarData = (dataISO) => {
      const d = new Date(dataISO);
      const dia = String(d.getDate()).padStart(2, "0");
      const mes = String(d.getMonth() + 1).padStart(2, "0");
      const ano = d.getFullYear();
      return `${dia}/${mes}/${ano}`;
    };

    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs/${codigo}/dados?formato=json&dataInicial=${formatarData(dataInicial)}&dataFinal=${formatarData(dataFinal)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao consultar API BCB: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
