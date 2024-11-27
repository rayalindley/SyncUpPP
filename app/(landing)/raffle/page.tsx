"use client"
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Tab } from '@headlessui/react'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

function maskEmail(email: string) {
  const [username, domain] = email.split('@')
  const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1)
  return `${maskedUsername}@${domain}`
}

export default function GiveawayPage() {
  const EXCLUDED_USERS = [
    "James Ocampo",
    "Aliza Bataluna",
    "Bianca Carabio",
    "Francis Secuya",
    "Mark Kenneth Badilla",
    "Mark Bardill",
  ];

  const [qualifiedSearchQuery, setQualifiedSearchQuery] = useState("")
  const [almostQualifiedSearchQuery, setAlmostQualifiedSearchQuery] = useState("")
  const [qualifiedUsers, setQualifiedUsers] = useState<any[]>([])
  const [almostQualifiedUsers, setAlmostQualifiedUsers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      const supabase = createClient()
      
      const { data: qualified, error: qualifiedError } = await supabase
        .from('giveaway_qualified_users')
        .select('email, complete_name, qualified, is_organizer')
        .eq('qualified', true)

      const { data: almostQualified, error: almostQualifiedError } = await supabase
        .from('giveaway_qualified_users')
        .select('email, complete_name, is_part_of_org, has_registered_event, has_commented_on_post')
        .eq('qualified', false)
        .or('is_part_of_org.eq.false,has_registered_event.eq.false,has_commented_on_post.eq.false')

      if (qualifiedError || almostQualifiedError) {
        setError(qualifiedError?.message || almostQualifiedError?.message || 'Error fetching users')
        return
      }

      setQualifiedUsers(qualified || [])
      setAlmostQualifiedUsers(almostQualified || [])
    }

    fetchUsers()
  }, [])

  // Modify the filtered users logic
  const filteredQualifiedUsers = qualifiedUsers?.filter(user => {
    // Check if any excluded name appears within the user's name
    const isExcluded = EXCLUDED_USERS.some(excludedName => 
      user.complete_name.toLowerCase().includes(excludedName.toLowerCase())
    );
    return !isExcluded && (
      user.complete_name.toLowerCase().includes(qualifiedSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(qualifiedSearchQuery.toLowerCase())
    );
  });

  const filteredAlmostQualifiedUsers = almostQualifiedUsers?.filter(user => {
    // Check if any excluded name appears within the user's name
    const isExcluded = EXCLUDED_USERS.some(excludedName => 
      user.complete_name.toLowerCase().includes(excludedName.toLowerCase())
    );
    return !isExcluded && (
      user.complete_name.toLowerCase().includes(almostQualifiedSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(almostQualifiedSearchQuery.toLowerCase())
    );
  });

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-light text-center">
        SyncUp Raffle
      </h1>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-charleston p-1 max-w-md mx-auto mb-8">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white/60 ring-offset-2 ring-offset-charleston focus:outline-none focus:ring-2',
                selected
                  ? 'bg-primary text-white shadow'
                  : 'text-gray-400 hover:bg-white/[0.12] hover:text-white'
              )
            }
          >
            Qualified ({filteredQualifiedUsers?.length || 0})
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white/60 ring-offset-2 ring-offset-charleston focus:outline-none focus:ring-2',
                selected
                  ? 'bg-primary text-white shadow'
                  : 'text-gray-400 hover:bg-white/[0.12] hover:text-white'
              )
            }
          >
            Almost Qualified ({filteredAlmostQualifiedUsers?.length || 0})
          </Tab>
        </Tab.List>

        <Tab.Panels>
          <Tab.Panel>
            {/* Qualified Users Panel */}
            <div className="relative w-full max-w-md mx-auto mb-6">
              <input
                type="text"
                placeholder="Search qualified users..."
                value={qualifiedSearchQuery}
                onChange={(e) => setQualifiedSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-charleston bg-charleston p-2 pl-10 pr-4 text-sm text-light focus:border-primary focus:ring-primary"
              />
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
              </div>
            </div>

            <p className="text-center text-sm text-green-400 mb-6 bg-green-900/30 p-4 rounded-lg max-w-2xl mx-auto">
              Qualified users have completed the requirements within the site, but they must answer and submit the form <a href="https://forms.gle/nEEAGhVXDtts2SQd8" className="underline text-blue-400 hover:text-blue-300">here</a>.
            </p>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {!filteredQualifiedUsers || filteredQualifiedUsers.length === 0 ? (
                <p className="text-gray-400 text-center">No qualified users found.</p>
              ) : (
                filteredQualifiedUsers.map((user) => (
                  <div 
                    key={user.email} 
                    className="p-4 border rounded-md shadow-sm hover:shadow-md transition-shadow bg-eerieblack"
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-light">{user.complete_name}</p>
                      {user.is_organizer && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded-full">
                          Organizer
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 font-mono">{maskEmail(user.email)}</p>
                  </div>
                ))
              )}
            </div>
          </Tab.Panel>

          <Tab.Panel>
            {/* Almost Qualified Users Panel */}
            <div className="relative w-full max-w-md mx-auto mb-6">
              <input
                type="text"
                placeholder="Search almost qualified users..."
                value={almostQualifiedSearchQuery}
                onChange={(e) => setAlmostQualifiedSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-charleston bg-charleston p-2 pl-10 pr-4 text-sm text-light focus:border-primary focus:ring-primary"
              />
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
              </div>
            </div>

            <div className="text-center text-sm text-red-400 mb-6 bg-red-900/30 p-4 rounded-lg max-w-2xl mx-auto">
              <p className="font-medium mb-2">To qualify for the raffle, you must:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Join an organization on the SyncUp platform: <a href="https://syncup-org.vercel.app/" className="underline text-blue-400 hover:text-blue-300">SyncUp</a></li>
                <li>Participate in an event via the platform *</li>
                <li>Comment on a post within the platform</li>
                <li>Answer all questions in this survey truthfully and diligently</li>
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {!filteredAlmostQualifiedUsers || filteredAlmostQualifiedUsers.length === 0 ? (
                <p className="text-gray-400 text-center">No users close to qualifying found.</p>
              ) : (
                filteredAlmostQualifiedUsers.map((user) => {
                  const reasons = []
                  if (!user.is_part_of_org) reasons.push('Has not joined an organization')
                  if (!user.has_registered_event) reasons.push('Has not registered for an event')
                  if (!user.has_commented_on_post) reasons.push('Has not commented on a post')

                  return (
                    <div 
                      key={user.email} 
                      className="p-4 border rounded-md shadow-sm hover:shadow-md transition-shadow bg-eerieblack"
                    >
                      <p className="font-medium text-light">{user.complete_name}</p>
                      <p className="text-sm text-gray-400 font-mono">{maskEmail(user.email)}</p>
                      <ul className="mt-2 text-sm text-red-400">
                        {reasons.map((reason, index) => (
                          <li key={index}>- {reason}</li>
                        ))}
                      </ul>
                    </div>
                  )
                })
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}
