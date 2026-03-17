"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useAuthModal } from "@/components/global/AuthModal"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

type PollOption = {
  id: string
  label: string
  _count: { votes: number }
}

export function PublicSentimentPoll({ entityId, entityType }: { entityId: string; entityType: string }) {
  const { data: session } = useSession()
  const { openAuthModal } = useAuthModal()
  const [options, setOptions] = useState<PollOption[]>([])
  const [userVote, setUserVote] = useState<string | null>(null)
  const [totalVotes, setTotalVotes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    fetch(`/api/polls/${entityId}?entityType=${entityType}`)
      .then(res => res.json())
      .then(data => {
        if (data?.poll) {
          setOptions(data.poll.options)
          setUserVote(data.userVote)
          setTotalVotes(data.poll.options.reduce((acc: number, o: PollOption) => acc + o._count.votes, 0))
        }
        setLoading(false)
      })
  }, [entityId, entityType])

  const handleVote = async (optionId: string) => {
    if (!session) {
      openAuthModal()
      return
    }

    // Clicking the same option = undo vote
    if (userVote === optionId) {
      await undoVote()
      return
    }

    setVoting(true)
    const res = await fetch(`/api/polls/${entityId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId, entityType }),
    })

    if (res.ok) {
      const data = await res.json()
      setOptions(data.poll.options)
      setUserVote(data.userVote)
      setTotalVotes(data.poll.options.reduce((acc: number, o: PollOption) => acc + o._count.votes, 0))
    }
    setVoting(false)
  }

  const undoVote = async () => {
    if (!userVote) return

    setVoting(true)
    const res = await fetch(`/api/polls/${entityId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })

    if (res.ok) {
      const data = await res.json()
      setOptions(data.poll.options)
      setUserVote(data.userVote)
      setTotalVotes(data.poll.options.reduce((acc: number, o: PollOption) => acc + o._count.votes, 0))
    }
    setVoting(false)
  }

  if (loading) return <div className="animate-pulse h-24 bg-card rounded-md w-full" />

  if (!options || options.length === 0) return null

  return (
    <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Public Sentiment</h3>
        <span className="text-xs text-muted-foreground">{totalVotes} votes</span>
      </div>

      <div className="flex flex-col gap-3">
        {options.map((opt) => {
          const percent = totalVotes === 0 ? 0 : Math.round((opt._count.votes / totalVotes) * 100)
          const isSelected = userVote === opt.id

          return (
            <div key={opt.id} className="relative">
              <Button
                variant="outline"
                className={`w-full justify-between h-10 transition-all ${
                  isSelected ? "border-primary bg-primary/10 font-semibold" : "hover:border-primary/50"
                }`}
                onClick={() => handleVote(opt.id)}
                disabled={voting}
              >
                <div className="flex items-center gap-2 z-10 w-full">
                  <span className="font-medium">{opt.label}</span>
                  <span className="ml-auto text-sm">{percent}%</span>
                </div>
              </Button>
              {/* Progress background */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-secondary/80 pointer-events-none rounded-md transition-all duration-500 ease-out"
                style={{ width: `${percent}%`, opacity: userVote ? 1 : 0 }}
              />
            </div>
          )
        })}
      </div>

      {userVote && (
        <button
          onClick={undoVote}
          disabled={voting}
          className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
        >
          <X className="w-3 h-3" />
          Undo your vote
        </button>
      )}

      {!session && !userVote && (
        <button
          onClick={openAuthModal}
          className="text-xs text-muted-foreground hover:text-primary transition-colors text-center mt-2"
        >
          Pick a username to cast your vote →
        </button>
      )}
    </div>
  )
}
