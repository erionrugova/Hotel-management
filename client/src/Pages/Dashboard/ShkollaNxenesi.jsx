import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit3,
  Filter,
  GraduationCap,
  Plus,
  RefreshCw,
  School,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import apiService from "../../services/api";
import { Card, CardContent } from "../../components/card";
import { useUser } from "../../UserContext";

const emptySchoolForm = {
  emri: "",
  qyteti: "",
};

const emptyStudentForm = {
  emriNxenesit: "",
  klasa: "",
  shkollaId: "",
};

function formatApiError(error) {
  const errors = error?.response?.data?.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    return errors.map((item) => item.msg).join(" | ");
  }

  return error?.response?.data?.error || error?.message || "Ndodhi një gabim.";
}

function Modal({ title, children, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
          initial={{ scale: 0.96, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 16 }}
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ShkollaNxenesi() {
  const { isAdmin, isManager } = useUser();
  const canManage = isAdmin() || isManager();

  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");

  const [schoolForm, setSchoolForm] = useState(emptySchoolForm);
  const [studentForm, setStudentForm] = useState(emptyStudentForm);
  const [editingSchool, setEditingSchool] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const [schoolData, studentData] = await Promise.all([
        apiService.getSchools(),
        apiService.getStudents(selectedSchoolId),
      ]);

      setSchools(Array.isArray(schoolData) ? schoolData : []);
      setStudents(Array.isArray(studentData) ? studentData : []);
    } catch (err) {
      console.error("Failed to load schools/students:", err);
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSchoolId]);

  const filteredSchools = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return schools;

    return schools.filter((schoolItem) => {
      return (
        schoolItem.emri?.toLowerCase().includes(term) ||
        schoolItem.qyteti?.toLowerCase().includes(term)
      );
    });
  }, [schools, searchTerm]);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return students;

    return students.filter((student) => {
      return (
        student.emriNxenesit?.toLowerCase().includes(term) ||
        student.klasa?.toLowerCase().includes(term) ||
        student.shkolla?.emri?.toLowerCase().includes(term)
      );
    });
  }, [students, searchTerm]);

  const totalStudents = students.length;
  const selectedSchool = schools.find((item) => String(item.id) === String(selectedSchoolId));

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 2500);
  };

  const handleCreateSchool = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiService.createSchool(schoolForm);
      setSchoolForm(emptySchoolForm);
      showSuccess("Shkolla u shtua me sukses.");
      await fetchData();
    } catch (err) {
      console.error("Failed to create school:", err);
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateStudent = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiService.createStudent(studentForm);
      setStudentForm({ ...emptyStudentForm, shkollaId: selectedSchoolId || "" });
      showSuccess("Nxënësi u shtua me sukses.");
      await fetchData();
    } catch (err) {
      console.error("Failed to create student:", err);
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSchool = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiService.updateSchool(editingSchool.id, {
        emri: editingSchool.emri,
        qyteti: editingSchool.qyteti,
      });
      setEditingSchool(null);
      showSuccess("Shkolla u përditësua me sukses.");
      await fetchData();
    } catch (err) {
      console.error("Failed to update school:", err);
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStudent = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiService.updateStudent(editingStudent.id, {
        emriNxenesit: editingStudent.emriNxenesit,
        klasa: editingStudent.klasa,
        shkollaId: editingStudent.shkollaId,
      });
      setEditingStudent(null);
      showSuccess("Nxënësi u përditësua me sukses.");
      await fetchData();
    } catch (err) {
      console.error("Failed to update student:", err);
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchool = async (schoolItem) => {
    const confirmed = window.confirm(
      `A je i sigurt që dëshiron ta fshish shkollën "${schoolItem.emri}"? Bashkë me të fshihen edhe nxënësit e saj.`,
    );
    if (!confirmed) return;

    setError("");

    try {
      await apiService.deleteSchool(schoolItem.id);
      if (String(selectedSchoolId) === String(schoolItem.id)) setSelectedSchoolId("");
      showSuccess("Shkolla u fshi me sukses.");
      await fetchData();
    } catch (err) {
      console.error("Failed to delete school:", err);
      setError(formatApiError(err));
    }
  };

  const handleDeleteStudent = async (student) => {
    const confirmed = window.confirm(
      `A je i sigurt që dëshiron ta fshish nxënësin "${student.emriNxenesit}"?`,
    );
    if (!confirmed) return;

    setError("");

    try {
      await apiService.deleteStudent(student.id);
      showSuccess("Nxënësi u fshi me sukses.");
      await fetchData();
    } catch (err) {
      console.error("Failed to delete student:", err);
      setError(formatApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-indigo-400">
            Lënda Laboratorike 1
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Shkolla & Nxënës</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Menaxho shkollat, nxënësit dhe filtro nxënësit sipas shkollës duke përdorur strukturën ekzistuese të dashboard-it.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Shkolla të regjistruara</p>
              <p className="mt-2 text-3xl font-bold">{schools.length}</p>
            </div>
            <div className="rounded-2xl bg-indigo-500/15 p-3 text-indigo-300">
              <School size={28} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Nxënës të listuar</p>
              <p className="mt-2 text-3xl font-bold">{totalStudents}</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300">
              <Users size={28} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Filtri aktiv</p>
              <p className="mt-2 text-lg font-semibold">
                {selectedSchool ? selectedSchool.emri : "Të gjitha shkollat"}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-300">
              <Filter size={28} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardContent>
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-indigo-500/15 p-2 text-indigo-300">
                <Plus size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Shto Shkollë</h2>
                <p className="text-sm text-slate-400">Plotëso emrin e shkollës dhe qytetin.</p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleCreateSchool}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Emri i shkollës</label>
                <input
                  value={schoolForm.emri}
                  onChange={(e) => setSchoolForm({ ...schoolForm, emri: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-500"
                  placeholder="p.sh. Shkolla e Mesme Teknike"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Qyteti</label>
                <input
                  value={schoolForm.qyteti}
                  onChange={(e) => setSchoolForm({ ...schoolForm, qyteti: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-500"
                  placeholder="p.sh. Prishtinë"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!canManage || saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={18} />
                Shto Shkollën
              </button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardContent>
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-300">
                <GraduationCap size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Shto Nxënës</h2>
                <p className="text-sm text-slate-400">Gjatë krijimit duhet të zgjedhet shkolla nga dropdown-i.</p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleCreateStudent}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Emri i nxënësit</label>
                <input
                  value={studentForm.emriNxenesit}
                  onChange={(e) => setStudentForm({ ...studentForm, emriNxenesit: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-500"
                  placeholder="p.sh. Eljesa Azemi"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Klasa</label>
                  <input
                    value={studentForm.klasa}
                    onChange={(e) => setStudentForm({ ...studentForm, klasa: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-500"
                    placeholder="p.sh. XII-1"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Shkolla</label>
                  <select
                    value={studentForm.shkollaId}
                    onChange={(e) => setStudentForm({ ...studentForm, shkollaId: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-500"
                    required
                  >
                    <option value="">Zgjedh shkollën</option>
                    {schools.map((schoolItem) => (
                      <option key={schoolItem.id} value={schoolItem.id}>
                        {schoolItem.emri}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canManage || saving || schools.length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={18} />
                Shto Nxënësin
              </button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Kërkim dhe filtrim</h2>
              <p className="text-sm text-slate-400">Filtro nxënësit sipas shkollës dhe kërko në lista.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-500 sm:w-72"
                  placeholder="Kërko shkollë ose nxënës..."
                />
              </div>

              <select
                value={selectedSchoolId}
                onChange={(e) => {
                  setSelectedSchoolId(e.target.value);
                  setStudentForm((prev) => ({ ...prev, shkollaId: e.target.value || prev.shkollaId }));
                }}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-500"
              >
                <option value="">Të gjitha shkollat</option>
                {schools.map((schoolItem) => (
                  <option key={schoolItem.id} value={schoolItem.id}>
                    {schoolItem.emri}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardContent>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Lista e shkollave</h2>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                {filteredSchools.length} rezultat/e
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Emri</th>
                      <th className="px-4 py-3">Qyteti</th>
                      <th className="px-4 py-3">Nxënës</th>
                      <th className="px-4 py-3 text-right">Veprime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {loading ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-slate-400" colSpan="5">
                          Duke u ngarkuar...
                        </td>
                      </tr>
                    ) : filteredSchools.length === 0 ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-slate-400" colSpan="5">
                          Nuk ka shkolla të regjistruara.
                        </td>
                      </tr>
                    ) : (
                      filteredSchools.map((schoolItem) => (
                        <tr key={schoolItem.id} className="bg-slate-900/60 hover:bg-slate-800/60">
                          <td className="px-4 py-3 text-slate-400">#{schoolItem.id}</td>
                          <td className="px-4 py-3 font-medium text-white">{schoolItem.emri}</td>
                          <td className="px-4 py-3 text-slate-300">{schoolItem.qyteti}</td>
                          <td className="px-4 py-3 text-slate-300">{schoolItem._count?.nxenesit ?? 0}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingSchool(schoolItem)}
                                className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-indigo-500 hover:text-indigo-300"
                                title="Përditëso"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSchool(schoolItem)}
                                className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-red-500 hover:text-red-300"
                                title="Fshi"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardContent>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Lista e nxënësve</h2>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                {filteredStudents.length} rezultat/e
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Emri</th>
                      <th className="px-4 py-3">Klasa</th>
                      <th className="px-4 py-3">Shkolla</th>
                      <th className="px-4 py-3 text-right">Veprime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {loading ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-slate-400" colSpan="5">
                          Duke u ngarkuar...
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-slate-400" colSpan="5">
                          Nuk ka nxënës për këtë filtër.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student.id} className="bg-slate-900/60 hover:bg-slate-800/60">
                          <td className="px-4 py-3 text-slate-400">#{student.id}</td>
                          <td className="px-4 py-3 font-medium text-white">{student.emriNxenesit}</td>
                          <td className="px-4 py-3 text-slate-300">{student.klasa}</td>
                          <td className="px-4 py-3 text-slate-300">{student.shkolla?.emri || "-"}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingStudent({
                                    ...student,
                                    shkollaId: String(student.shkollaId),
                                  })
                                }
                                className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-indigo-500 hover:text-indigo-300"
                                title="Përditëso"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStudent(student)}
                                className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-red-500 hover:text-red-300"
                                title="Fshi"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {editingSchool && (
        <Modal title="Përditëso shkollën" onClose={() => setEditingSchool(null)}>
          <form className="space-y-4" onSubmit={handleUpdateSchool}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Emri i shkollës</label>
              <input
                value={editingSchool.emri}
                onChange={(e) => setEditingSchool({ ...editingSchool, emri: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Qyteti</label>
              <input
                value={editingSchool.qyteti}
                onChange={(e) => setEditingSchool({ ...editingSchool, qyteti: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-500"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingSchool(null)}
                className="rounded-xl border border-slate-700 px-4 py-2.5 font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Anulo
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                Ruaj ndryshimet
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editingStudent && (
        <Modal title="Përditëso nxënësin" onClose={() => setEditingStudent(null)}>
          <form className="space-y-4" onSubmit={handleUpdateStudent}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Emri i nxënësit</label>
              <input
                value={editingStudent.emriNxenesit}
                onChange={(e) => setEditingStudent({ ...editingStudent, emriNxenesit: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-500"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Klasa</label>
                <input
                  value={editingStudent.klasa}
                  onChange={(e) => setEditingStudent({ ...editingStudent, klasa: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Shkolla</label>
                <select
                  value={editingStudent.shkollaId}
                  onChange={(e) => setEditingStudent({ ...editingStudent, shkollaId: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-500"
                  required
                >
                  <option value="">Zgjedh shkollën</option>
                  {schools.map((schoolItem) => (
                    <option key={schoolItem.id} value={schoolItem.id}>
                      {schoolItem.emri}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="rounded-xl border border-slate-700 px-4 py-2.5 font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Anulo
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                Ruaj ndryshimet
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default ShkollaNxenesi;
