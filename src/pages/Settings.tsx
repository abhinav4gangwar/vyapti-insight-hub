import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Activity, ChevronRight, FileCode, Sparkles } from "lucide-react";
import { authService } from "@/lib/auth";

export default function Settings() {
  const navigate = useNavigate();
  const user = authService.getUser();
  const isAdmin = user?.username === "admin";
  const isPromptRegistryAuthorized = authService.isPromptRegistryAuthorized();
  const isPromptTriggerQuestionsAuthorized = authService.isPromptTriggerQuestionsAuthorized();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {/* Change Password */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/change-password')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Lock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Change Password</h3>
                    <p className="text-sm text-gray-600">Update your account password</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          {/* Activity Logs - Only for Admin */}
          {isAdmin && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/activity-logs')}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Activity Logs</h3>
                      <p className="text-sm text-gray-600">View all user activity and API requests</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prompt Registry - Only for Authorized Users */}
          {isPromptRegistryAuthorized && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/prompt-registry')}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FileCode className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Prompt Registry</h3>
                      <p className="text-sm text-gray-600">Manage AI service prompts and versions</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prompt Trigger Questions - Only for Authorized Users */}
          {isPromptTriggerQuestionsAuthorized && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/prompt-trigger-questions')}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-lg">
                      <Sparkles className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Prompt Trigger Questions</h3>
                      <p className="text-sm text-gray-600">Manage questions and groups for document analysis</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Username</p>
                <p className="font-medium text-gray-900">{user?.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">User ID</p>
                <p className="font-medium text-gray-900">{user?.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium text-gray-900">
                  {user?.is_active ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Inactive</span>
                  )}
                </p>
              </div>
              {isAdmin && (
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-medium text-gray-900">Administrator</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

