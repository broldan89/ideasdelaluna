import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase.js';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('precios_cotizador')
      .select('*')
      .order('clave', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json(data);
  } else if (req.method === 'POST') {
    const { clave, precio, material } = req.body;

    const { data, error } = await supabase
      .from('precios_cotizador')
      .insert([{ clave, precio, material }]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
