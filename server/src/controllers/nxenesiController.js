import prisma from '../config/prisma.js';

export const getAllNxenesit = async (req, res) => {
  try {
    const { shkollaId } = req.query;

    const nxenesit = await prisma.nxenesi.findMany({
      where: shkollaId ? { shkollaId: Number(shkollaId) } : {},
      orderBy: { id: 'desc' },
      include: { shkolla: true }
    });

    res.json(nxenesit);
  } catch (error) {
    res.status(500).json({ message: 'Gabim gjatë leximit të nxënësve.', error: error.message });
  }
};

export const createNxenesi = async (req, res) => {
  try {
    const { emriNxenesit, klasa, shkollaId } = req.body;

    if (!emriNxenesit || !klasa || !shkollaId) {
      return res.status(400).json({ message: 'Emri i nxënësit, klasa dhe shkolla janë të detyrueshme.' });
    }

    const shkolla = await prisma.shkolla.findUnique({
      where: { id: Number(shkollaId) }
    });

    if (!shkolla) {
      return res.status(404).json({ message: 'Shkolla e zgjedhur nuk ekziston.' });
    }

    const nxenesi = await prisma.nxenesi.create({
      data: {
        emriNxenesit,
        klasa,
        shkollaId: Number(shkollaId)
      },
      include: { shkolla: true }
    });

    res.status(201).json(nxenesi);
  } catch (error) {
    res.status(500).json({ message: 'Gabim gjatë krijimit të nxënësit.', error: error.message });
  }
};
