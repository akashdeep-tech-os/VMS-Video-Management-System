import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import BodyHead from "../../components/common/BodyHead";
import UserHeader from "../../components/users/UserHeader";
import UserTable from "../../components/users/UserTable";
import AddUserModal from "../../components/users/AddUserModal";
import userService from "../../api/userService";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";

function Users() {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const { setIsPageBlurred } = useOutletContext() || {};

  useEffect(() => {
    if (setIsPageBlurred) {
      setIsPageBlurred(showModal);
    }
    return () => setIsPageBlurred?.(false);
  }, [showModal, setIsPageBlurred]);

  const fetchUsersAndRoles = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const [usersData, rolesData] = await Promise.all([
        userService.getUsers(),
        userService.getGroups(),
      ]);
      setUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
      setRoles(Array.isArray(rolesData) ? rolesData : rolesData.results || []);
      setSelectedIds([]);
    } catch (err) {
      console.error("Failed to fetch data", err);
      setError("Failed to fetch data.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const handleRefresh = () => {
    fetchUsersAndRoles();
  };

  const triggerDelete = (id) => {
    setDeleteTarget({ type: "single", id });
  };

  const triggerBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setDeleteTarget({ type: "bulk" });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "single") {
      const id = deleteTarget.id;
      try {
        await userService.deleteUser(id);
        setUsers((prev) => prev.filter((user) => user.id !== id));
        setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      } catch (err) {
        console.error("Failed to delete user", err);
        alert("Failed to delete user.");
      }
    } else if (deleteTarget.type === "bulk") {
      try {
        for (const id of selectedIds) {
          await userService.deleteUser(id);
        }
        setUsers((prev) =>
          prev.filter((user) => !selectedIds.includes(user.id)),
        );
        setSelectedIds([]);
      } catch (err) {
        console.error("Failed to delete users", err);
        alert("Failed to delete some users.");
      }
    }
    setDeleteTarget(null);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = (ids) => {
    setSelectedIds(selectedIds.length === ids.length ? [] : ids);
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleAddClick = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleSaveUser = async (userData) => {
    try {
      if (editingUser) {
        const updatedUser = await userService.updateUser(
          editingUser.id,
          userData,
        );
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? updatedUser : u)),
        );
      } else {
        const createdUser = await userService.createUser(userData);
        setUsers((prev) => [createdUser, ...prev]);
      }
    } catch (err) {
      console.error("Failed to save user", err);
      alert("Failed to save user: " + (err.message || "Unknown error"));
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = search.toLowerCase();
    return (
      (user.username && user.username.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <BodyHead>
        <UserHeader
          search={search}
          setSearch={setSearch}
          selectedIds={selectedIds}
          handleBulkDelete={triggerBulkDelete}
          onAddClick={handleAddClick}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      </BodyHead>

      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        <div
          className={`flex-1 min-h-0 flex flex-col overflow-hidden transition-opacity duration-200 ${isRefreshing ? "opacity-40 pointer-events-none" : ""}`}
        >
          {error && (
            <div className="m-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          <UserTable
            users={filteredUsers}
            roles={roles}
            handleDelete={triggerDelete}
            onEdit={handleEditClick}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
            toggleSelectAll={toggleSelectAll}
          />
        </div>
      </div>

      <AddUserModal
        key={`${showModal}-${editingUser?.id || "new"}`}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        roles={roles}
        initialData={editingUser}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title={
          deleteTarget?.type === "bulk" ? "Bulk Delete Users" : "Delete User"
        }
        message={
          deleteTarget?.type === "bulk"
            ? `Are you sure you want to delete ${selectedIds.length} user(s)? This action cannot be undone.`
            : "Are you sure you want to delete this user? This action cannot be undone."
        }
      />
    </div>
  );
}

export default Users;
