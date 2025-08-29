"use client";
import { useState, useEffect } from "react";
import { Globe, Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ShowMembers from "@/components/Members";

const toastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
};

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState(null);
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchWorkspaces = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "workspaces"));

        const workspaceData = await Promise.all(
          querySnapshot.docs.map(async (workspaceDoc) => {
            const membersRef = collection(
              db,
              `workspaces/${workspaceDoc.id}/members`
            );
            const membersSnapshot = await getDocs(membersRef);

            const userMemberData = membersSnapshot.docs.find(
              (doc) => doc.data().userId === user.uid
            );

            if (!userMemberData) return null;

            return {
              id: workspaceDoc.id,
              ...workspaceDoc.data(),
              role: userMemberData.data().role || "Unknown",
            };
          })
        );

        setWorkspaces(workspaceData.filter(Boolean));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching workspaces:", error);
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [user]);

  const createWorkspace = async () => {
    setIsOpen(true);
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName || isCreating) return;

    try {
      setIsCreating(true);
      const workspaceRef = await addDoc(collection(db, "workspaces"), {
        name: workspaceName,
        isPublic,
      });

      const membersRef = collection(db, `workspaces/${workspaceRef.id}/members`);
      await setDoc(doc(membersRef, user.uid), {
        userId: user.uid,
        role: "owner",
        displayName: user.displayName || "Unknown",
        photoURL: user.photoURL || "/robotic.png",
      });

      const cursorsRef = doc(db, `workspaces/${workspaceRef.id}`);
      await setDoc(cursorsRef, { cursors: {} }, { merge: true });

      setWorkspaces([
        ...workspaces,
        { id: workspaceRef.id, name: workspaceName, isPublic, role: "owner" },
      ]);
      toast.success("Workspace created successfully!", toastOptions);
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to create workspace.", toastOptions);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteWorkspace = async (workspaceId) => {
    const confirmationToast = toast(
      <div className="flex justify-between items-center gap-4">
        <span>Are you sure you want to delete this workspace?</span>
        <div className="flex space-x-2">
          <Button
            onClick={async () => {
              try {
                setDeletingWorkspaceId(workspaceId);
                await deleteDoc(doc(db, `workspaces/${workspaceId}`));
                setWorkspaces(workspaces.filter((ws) => ws.id !== workspaceId));
                toast.success("Workspace deleted successfully!", toastOptions);
              } catch (error) {
                toast.error("Failed to delete workspace.", toastOptions);
              } finally {
                setDeletingWorkspaceId(null);
                toast.dismiss(confirmationToast);
              }
            }}
            className="bg-red-600 hover:bg-red-500 text-white"
            disabled={deletingWorkspaceId === workspaceId}
          >
            {deletingWorkspaceId === workspaceId ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
          <Button
            onClick={() => toast.dismiss(confirmationToast)}
            className="bg-gray-500 hover:bg-gray-600 text-white"
            disabled={deletingWorkspaceId === workspaceId}
          >
            Cancel
          </Button>
        </div>
      </div>,
      {
        ...toastOptions,
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        hideProgressBar: true,
      }
    );
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col animate-gradient">
      <ToastContainer />
      <Header />

      <div className="flex justify-between items-center p-6">
        <h1 className="text-4xl border-b border-blue-500 font-mono text-blue-300">Your Workspaces :</h1>

        <Button
          onClick={createWorkspace}
          className="relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-md group hover:from-purple-700 hover:to-blue-700 transform transition-all duration-300 ease-out hover:scale-105 z-0"
          disabled={isCreating}
        >
          {isCreating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <span className="absolute left-0 inset-y-0 flex items-center pl-2 group-hover:translate-x-2 transition-all duration-300 ease-out">
                <PlusCircle size={22} />
              </span>
              <span className="ml-4 group-hover:ml-6 transition-all duration-300 ease-out">
                Create Workspace
              </span>
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <p className="text-center text-gray-400">Loading workspaces...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {workspaces.length === 0 ? (
              <p className="text-gray-400 col-span-3 text-center">
                No workspaces found. Create one!
              </p>
            ) : (
              workspaces.map((ws) => (
                <Card
                  key={ws.id}
                  className="relative group border border-blue-500 bg-opacity-10 backdrop-blur-md p-2 bg-slate-900 rounded-xl transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/50"
                >
                  <CardContent className="p-6 flex flex-col gap-4">
                    <Link href={`/workspace/${ws.id}`} className="block">
                      <div className="flex flex-col gap-3">
                        <h2 className="text-3xl font-bold text-blue-400 tracking-wide group-hover:text-blue-300 transition-colors">
                          {ws.name}
                        </h2>
                        <p className="text-sm text-gray-300 font-mono">
                          {ws.isPublic ? "🔓 Public Workspace" : "🔒 Private Workspace"}
                        </p>
                
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-yellow-400 font-medium">Role: {ws.role}</p>
                          <span className="text-lg text-gray-200 bg-gray-900 px-4 py-2 rounded-full flex items-center gap-2 border border-gray-700">
                            👥 People: <ShowMembers workspaceId={ws.id} />
                          </span>
                        </div>
                      </div>
                    </Link>

                    {ws.role === "owner" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:scale-110 transition-transform duration-200"
                        onClick={(e) => {
                          e.preventDefault();
                          deleteWorkspace(ws.id);
                        }}
                        disabled={deletingWorkspaceId === ws.id}
                      >
                        {deletingWorkspaceId === ws.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 size={20} />
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild />
        <DialogContent className="bg-[#1E293B] text-white">
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            <p className="mb-2">
              Enter the name of the workspace.
            </p>
            <Input
              placeholder="Workspace Name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="mb-4 text-white placeholder-white ring-1 ring-gray-400"
            />

            {/* <div className="flex space-x-4 mb-4">
              <Button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium shadow-md transition-all duration-300 ${
                  isPublic
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-indigo-600 hover:to-blue-500"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
                onClick={() => setIsPublic(true)}
              >
                <Globe className="w-5 h-5" />
                Public
              </Button>

              <Button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium shadow-md transition-all duration-300 ${
                  !isPublic
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-indigo-600 hover:to-blue-500"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
                onClick={() => setIsPublic(false)}
              >
                <Lock className="w-5 h-5" />
                Private
              </Button>
            </div> */}

            <div className="flex space-x-4">
              <Button
                onClick={handleCreateWorkspace}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-teal-600 hover:to-green-500 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;