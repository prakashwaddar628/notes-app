import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

type Note = {
  id: number;
  title: string | null;
  content: string | null;
  version: number;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selected, setSelected] = useState<Note | null>(null);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const loadNotes = async () => {
    try {
      const res = await api.get<Note[]>("/notes/");
      setNotes(res.data);
      if (!selected && res.data.length > 0) {
        setSelected(res.data[0]);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const createNote = async () => {
    const res = await api.post<Note>("/notes/", {
      title: "Untitled",
      content: "",
    });
    setNotes([res.data, ...notes]);
    setSelected(res.data);
  };

  const saveNote = async (note: Note) => {
    setStatus("Saving...");
    try {
      const res = await api.put<Note>(`/notes/${note.id}`, {
        title: note.title,
        content: note.content,
        version: note.version,
      });
      setStatus("Saved");
      setNotes((prev) =>
        prev.map((n) => (n.id === res.data.id ? res.data : n))
      );
      setSelected(res.data);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setStatus("Conflict detected. Please refresh.");
      } else {
        setStatus("Error saving note");
      }
    }
  };

  // auto-save after typing stops
  useEffect(() => {
    if (!selected) return;
    const timeout = setTimeout(() => {
      saveNote(selected);
    }, 800);
    return () => clearTimeout(timeout);
  }, [selected?.title, selected?.content]);

  const logout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 bg-gray-100 border-r p-4 flex flex-col">
        <div className="flex justify-between mb-4">
          <button
            onClick={createNote}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + New
          </button>
          <button
            onClick={logout}
            className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-black"
          >
            Logout
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {notes.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded cursor-pointer ${
                selected?.id === n.id
                  ? "bg-blue-100 border border-blue-400"
                  : "bg-white border"
              }`}
              onClick={() => setSelected(n)}
            >
              <div className="font-medium">{n.title || "Untitled"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6 space-y-4">
        {selected ? (
          <>
            <input
              className="w-full text-2xl font-semibold border-b pb-2 outline-none"
              value={selected.title ?? ""}
              onChange={(e) =>
                setSelected({ ...selected, title: e.target.value })
              }
            />

            <textarea
              className="w-full h-[75vh] border p-3 rounded outline-none"
              value={selected.content ?? ""}
              onChange={(e) =>
                setSelected({ ...selected, content: e.target.value })
              }
            />

            <p className="text-gray-500 text-sm">{status}</p>
          </>
        ) : (
          <p className="text-gray-500">Select or create a note to start.</p>
        )}
      </div>
    </div>
  );
}
