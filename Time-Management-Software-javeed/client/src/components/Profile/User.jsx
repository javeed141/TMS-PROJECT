"use client";

import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function UsersList() {
  const navigate=useNavigate()
  const [user, setUser] = useState(null); // single user
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) return;

      try {
       console.log(currentUser)
       setUser(currentUser)
        
      } catch (err) {
        toast.error("Error fetching user");
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(()=>{
    auth.onAuthStateChanged(user=>{
      if(!user)
        navigate("/signin", { replace: true })
      return;
    })
  },[navigate])

  const handleLogout=async()=>{
    await auth.signOut()
    window.location.href="/signin"
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center">User Details</h1>

        {loading ? (
          <p className="text-center text-gray-600">Loading user...</p>
        ) : user ? (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>{user.displayName}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Email: {user.email}</p>
              {user.role && <p>Role: {user.role}</p>}
            </CardContent>
          </Card>
        ) : (
          <p className="text-center text-red-500">No user found</p>
        )}
      </div>
      <button onClick={handleLogout}>
        LogOut
      </button>
    </div>
  );
}
