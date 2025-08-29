import { Mail, Trophy } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Stretch 5 Analytics Intro */}
      <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">What is Stretch 5 Analytics?</h2>
        <p className="text-sm text-gray-700 text-center leading-snug">
          Stretch 5 Analytics is a modern basketball analytics platform created by Will Hanley — a former professional
          basketball player turned data scientist — with the goal of expanding to all leagues and levels across the world, making high quality data and analytics accessable for players, coaches, and fans.
        </p>
      </div>

      {/* About Will Hanley - Condensed */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-orange-500" />
          About Will Hanley
        </h2>
        <p className="text-sm text-gray-700 mb-3">
          Will Hanley played internationally for 8 years before transitioning into the world of sports data.
        </p>
        <ul className="text-gray-600 text-xs space-y-1 pl-4 list-disc">
          <li>Head of Basketball at a sports analytics company</li>
          <li>Played in Spain, France, Portugal, Japan, and Uruguay</li>
          <li>5 ACB seasons with Valencia, CB Canarias & Gipuzkoa</li>
          <li>BCL champion, LEB Silver MVP & Champion</li>
          <li>Ireland National Team</li>
          <li>Bowdoin College, Class of 2012</li>
        </ul>
      </div>

      {/* Contact - Full Width */}
      <div className="bg-gray-100 rounded-lg p-4">
        <h3 className="font-semibold text-sm text-gray-900 mb-2 flex items-center">
          <Mail className="h-4 w-4 mr-2 text-gray-500" />
          Get In Touch
        </h3>
        <a
          href="mailto:willhanley11@gmail.com"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          willhanley11@gmail.com
        </a>
        <p className="text-xs text-gray-500 mt-1">
          Reach out with questions, ideas, or collaboration requests related to basketball analytics, team support, or custom visualizations.
        </p>
      </div>
    </div>
  )
}
