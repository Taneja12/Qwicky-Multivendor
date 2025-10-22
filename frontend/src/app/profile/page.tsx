import { redirect } from 'next/navigation';
import { requireUserSession } from '@/lib/serverAuth';
import { Suspense } from 'react';

interface UserProfile {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_joined: string;
  last_login?: string;
}

// Create a type for the fallback user data
interface FallbackUserData {
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  phone_number: string;
  last_login?: never;
}

// Union type for userData
type UserData = UserProfile | FallbackUserData;

// Helper function to check if userData has last_login
function hasLastLogin(userData: UserData): userData is UserProfile {
  return 'last_login' in userData && userData.last_login !== undefined;
}

function ProfileContent() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-6">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-4 pt-10">
        Your Profile
      </h1>
      <p className="text-gray-600 dark:text-gray-400">Profile content would go here...</p>
    </div>
  );
}

async function ProfileData() {
  const session = await requireUserSession();
  if (!session) return redirect('/login');

  const access = (session as any)?.access || (session as any)?.user?.access;
  
  // Fetch user profile data
  let userProfile: UserProfile | null = null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/user/`, {
      cache: 'no-store',
      headers: access ? { Authorization: `Bearer ${access}` } : undefined,
    });
    
    if (res.ok) {
      userProfile = await res.json();
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
  }

  const s = session as { user?: { email?: string; name?: string } };

  const userData: UserData = userProfile || {
    email: s.user?.email || 'Unknown',
    first_name: s.user?.name?.split(' ')[0] || '',
    last_name: s.user?.name?.split(' ')[1] || '',
    date_joined: new Date().toISOString(),
    phone_number: '',
  };

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  return (
    <>
      {/* Main profile section - exact same structure as cart */}
      <section aria-label="Your profile" className="max-w-4xl mx-auto space-y-8 p-4 md:p-6">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-4 pt-10">
          Your Profile
        </h1>

        <div className="space-y-8">
          {/* Profile Information Card */}
          <article className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
            <header className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div>
                <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  Personal Information
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage your account details and preferences
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {userData.first_name ? `${userData.first_name[0]}${userData.last_name?.[0] || ''}` : '👤'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Member since {formatDate(userData.date_joined)}
                </div>
              </div>
            </header>

            {/* Profile Details - similar to cart items list */}
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4 text-lg">Basic Information</h3>
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    <li className="flex items-center justify-between py-3">
                      <div className="font-medium text-gray-700 dark:text-gray-300">Email</div>
                      <div className="text-gray-600 dark:text-gray-400">{userData.email}</div>
                    </li>
                    
                    {userData.first_name && (
                      <li className="flex items-center justify-between py-3">
                        <div className="font-medium text-gray-700 dark:text-gray-300">First Name</div>
                        <div className="text-gray-600 dark:text-gray-400">{userData.first_name}</div>
                      </li>
                    )}
                    
                    {userData.last_name && (
                      <li className="flex items-center justify-between py-3">
                        <div className="font-medium text-gray-700 dark:text-gray-300">Last Name</div>
                        <div className="text-gray-600 dark:text-gray-400">{userData.last_name}</div>
                      </li>
                    )}
                    
                    {userData.phone_number && (
                      <li className="flex items-center justify-between py-3">
                        <div className="font-medium text-gray-700 dark:text-gray-300">Phone</div>
                        <div className="text-gray-600 dark:text-gray-400">{userData.phone_number}</div>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Account Stats */}
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4 text-lg">Account Status</h3>
                  <div className="space-y-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                            Account Status
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                            Active and verified
                          </p>
                        </div>
                        <div className="text-emerald-600 dark:text-emerald-400">
                          ✓
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            Member Since
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {formatDate(userData.date_joined)}
                          </p>
                        </div>
                        <div className="text-blue-600 dark:text-blue-400">
                          📅
                        </div>
                      </div>
                    </div>

                    {/* Fixed: Use type guard to check for last_login */}
                    {hasLastLogin(userData) && userData.last_login && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
                              Last Login
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                              {formatDate(userData.last_login)}
                            </p>
                          </div>
                          <div className="text-purple-600 dark:text-purple-400">
                            🔐
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Actions Footer - similar to cart footer */}
            <footer className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div className="text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Last Updated:</span>
                    <span className="text-gray-600 dark:text-gray-400">Recently</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors">
                  Edit Profile
                </button>
                <button className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                  Update Password
                </button>
              </div>
            </footer>
          </article>
        </div>
      </section>
    </>
  );
}

function ProfileLoading() {
  return (
    <section className="max-w-4xl mx-auto space-y-8 p-4 md:p-6">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-4 pt-10">
        Your Profile
      </h1>
      <div className="animate-pulse">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-64"></div>
              </div>
              <div className="text-right">
                <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
              <div>
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileData />
    </Suspense>
  );
}