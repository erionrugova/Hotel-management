import prisma from '../config/prisma.js';

export const getAllShkollat = async (req, res) => {
  try {
    const shkollat = await prisma.shkolla.findMany({
      orderBy: { id: 'desc' },
      include: { nxenesit: true }
    });
    res.json(shkollat);
  } catch (error) {
    res.status(500).json({ message: 'Gabim gjatë leximit të shkollave.', error: error.message });
  }
};

export const getShkollaById = async (req, res) => {
  try {
    const { id } = req.params;
    const shkolla = await prisma.shkolla.findUnique({
      where: { id: Number(id) },
      include: { nxenesit: true }
    });

    if (!shkolla) {
      return res.status(404).json({ message: 'Shkolla nuk u gjet.' });
    }

    res.json(shkolla);
  } catch (error) {
    res.status(500).json({ message: 'Gabim gjatë leximit të shkollës.', error: error.message });
  }
};

export const createShkolla = async (req, res) => {
  try {
    const { emri, qyteti } = req.body;

    if (!emri || !qyteti) {
      return res.status(400).json({ message: 'Emri i shkollës dhe qyteti janë të detyrueshme.' });
    }

    const shkolla = await prisma.shkolla.create({
      data: { emri, qyteti }
    });

    res.status(201).json(shkolla);
  } catch (error) {
    res.status(500).json({ message: 'Gabim gjatë krijimit të shkollës.', error: error.message });
  }
};

export const updateShkolla = async (req, res) => {
  try {
    const { id } = req.params;
    const { emri, qyteti } = req.body;

    if (!emri || !qyteti) {
      return res.status(400).json({ message: 'Emri i shkollës dhe qyteti janë të detyrueshme.' });
    }

    const shkolla = await prisma.shkolla.update({
      where: { id: Number(id) },
      data: { emri, qyteti }
    });

    res.json(shkolla);
  } catch (error) {
    res.status(500).json({ message: 'Gabim gjatë përditësimit të shkollës.', error: error.message });
  }
};

export const deleteShkolla = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.shkolla.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Shkolla u fshi me sukses.' });
  } catch (error) {
    res.status(500).json({ message: 'Gabim gjatë fshirjes së shkollës.', error: error.message });
  }
};
