export function formatDateBR(data) {
  const date = new Date(data);

  const options = { timeZone: "America/Sao_Paulo", year: "numeric", month: "numeric", day: "numeric" };

  const formattedDate = date.toLocaleString("pt-BR", options);
  return formattedDate;
}