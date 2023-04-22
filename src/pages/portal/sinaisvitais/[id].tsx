import { MongoClient, ObjectId } from 'mongodb';
import { useRouter } from 'next/router';
import connect from '../../../utils/Database';
import { NextApiRequest, NextApiResponse } from 'next';
import { formatDateBR } from '../../../utils/Functions'
import BotaoPadrao from '@/components/BotaoPadrao';


export async function getServerSideProps(context: any) {
  const id = context.query.id;
  const { db, client } = await connect();
  const collection = db.collection('sinaisvitais');
  const result = await collection.findOne({ _id: new ObjectId(id) });
  console.log(result)
  client.close();
  return {
    props: {
      sinaisVitais: JSON.parse(JSON.stringify(result)),
    },
  };
}

const fields = ["consciencia", "hemodinamico",
  "cardiovascular", "pressaoarterial", "respiratorio", "mucosas",
  "integridadecutanea", "mmss", "mmii", "aceitacaodadieta",
  "abdomen", "eliminacoes", "eliminacoesintestinais", "auscultapulmonar",
  "consciencia_obs", "hemodinamico_obs", "cardiovascular_obs", "pressaoarterial_obs",
  "respiratorio_obs", "mucosas_obs", "integridadecutanea_obs", "mmss_obs",
  "mmii_obs", "aceitacaodadieta_obs", "abdomen_obs", "eliminacoes_obs",
  "eliminacoesintestinais_obs", "auscultapulmonar_obs"];

function SinaisVitaisDetails({ sinaisVitais }: { sinaisVitais: any }) {
  return (
    <div>
      <BotaoPadrao href='/portal/sinaisvitais' text='Voltar' />
      <h1>{sinaisVitais.idoso}</h1>
      <h1>{formatDateBR(sinaisVitais.data)}</h1>
      <p className=''>{sinaisVitais._id}</p>
      {fields.map(field => (
      <p key={field}>{field}: {sinaisVitais[field]}</p>
    ))}
    </div>
  );
}

export default SinaisVitaisDetails;