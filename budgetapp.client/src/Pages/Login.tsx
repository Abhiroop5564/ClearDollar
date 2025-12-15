import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function LoginPage() {
    const [draft, setDraft] = useState("");
    const navigate = useNavigate();

    function submit(e: React.FormEvent) {
        e.preventDefault();

        const trimmed = draft.trim();
        if (!trimmed) return;

        localStorage.setItem("userId", trimmed);
        navigate("/dashboard", { replace: true });
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <form
                onSubmit={submit}
                className="bg-white border rounded-2xl p-6 w-full max-w-sm space-y-4"
            >
                <div>
                    <h1 className="text-lg font-semibold">Welcome</h1>
                    <p className="text-sm text-gray-500">
                        Enter your user ID to continue
                    </p>
                </div>

                <input
                    autoFocus
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-gray-300"
                    placeholder="demo-user"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                />

                <button
                    type="submit"
                    className="w-full px-4 py-2 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800"
                >
                    Continue
                </button>
            </form>
        </div>
    );
}
