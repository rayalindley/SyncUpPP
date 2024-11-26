import { createClient } from '@/lib/supabase/server'

function maskEmail(email: string) {
  const [username, domain] = email.split('@')
  const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1)
  return `${maskedUsername}@${domain}`
}

export default async function GiveawayPage() {
  const supabase = createClient();
  
  const { data: qualifiedUsers, error: qualifiedError } = await supabase
    .from('giveaway_qualified_users')
    .select('email, complete_name, qualified, is_organizer')
    .eq('qualified', true)

  const { data: almostQualifiedUsers, error: almostQualifiedError } = await supabase
    .from('giveaway_qualified_users')
    .select('email, complete_name, is_part_of_org, has_registered_event, has_commented_on_post')
    .eq('qualified', false)
    .or('is_part_of_org.eq.false,has_registered_event.eq.false,has_commented_on_post.eq.false')

  if (qualifiedError || almostQualifiedError) {
    console.error('Error fetching users:', qualifiedError || almostQualifiedError)
    return <div>Error loading users</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2 text-light text-center">
        Giveaway Qualified Users ({qualifiedUsers ? qualifiedUsers.length : 0})
      </h1>
      <p className="text-center text-sm text-green-500 mb-6">
        Qualified users have completed the requirements within the site, but they must answer and submit the form <a href="https://forms.gle/nEEAGhVXDtts2SQd8" className="underline text-blue-400">here</a>.
      </p>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!qualifiedUsers || qualifiedUsers.length === 0 ? (
          <p className="text-gray-400">No qualified users found.</p>
        ) : (
          qualifiedUsers.map((user) => (
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

      <h2 className="text-xl font-bold mt-8 mb-2 text-light text-center">
        Almost Qualified Users ({almostQualifiedUsers ? almostQualifiedUsers.length : 0})
      </h2>
      <p className="text-center text-sm text-red-500 mb-6">
        To qualify for the raffle, you must:
        <ul className="list-disc list-inside">
          <li>Join an organization on the SyncUp platform: <a href="https://syncup-org.vercel.app/" className="underline text-blue-400">SyncUp</a></li>
          <li>Participate in an event via the platform *</li>
          <li>Comment on a post within the platform</li>
          <li>Answer all questions in this survey truthfully and diligently</li>
        </ul>
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!almostQualifiedUsers || almostQualifiedUsers.length === 0 ? (
          <p className="text-gray-400">No users close to qualifying found.</p>
        ) : (
          almostQualifiedUsers.map((user) => {
            const reasons = []
            if (!user.is_part_of_org) reasons.push('Has not joined an organization')
            if (!user.has_registered_event) reasons.push('Has not registered for an event')
            if (!user.has_commented_on_post) reasons.push('Has not commented on a post')

            if (reasons.length === 3) return null

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
    </div>
  )
}
