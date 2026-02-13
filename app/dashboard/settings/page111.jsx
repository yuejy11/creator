'use client'

import { api } from "@/convex/_generated/api"
import { useConvexQuery } from "@/hooks/use-convex-query"
import React from "react"
import { BarLoader } from "react-spinners"

const SettingsPage =()=>{
  const { data: currentUser, isLoading }= useConvexQuery(
    api.users.getCurrentUser
  )

  if (isLoading) {
    return <BarLoader width={"95%"} color="#D8B4FE" />
  }

  return <div>SettingsPage</div>
}

export default SettingsPage