import { Link } from "react-router-dom";
import Loading from "./Loading";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4 shadow bg-white">
        <h1 className="text-2xl font-bold text-blue-600">ProCRM</h1>
        <div className="space-x-4">
          <Link to="/login" className="text-gray-600 hover:text-blue-600">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-4xl md:text-6xl font-bold text-gray-800 leading-tight">
          The Smarter Way to Manage{" "}
          <span className="text-blue-600">Customers</span>
        </h2>
          {/* const loading = false; // Replace with actual loading state if available */}
          {/* if (loading) return <Loading />; */}
        <p className="mt-4 text-lg text-gray-600 max-w-2xl">
          ProCRM helps you streamline sales, track customer interactions, and
          grow your business with AI-powered insights — all in one platform.
        </p>
        <div className="mt-6 flex space-x-4">
          <Link
            to="/login"
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg shadow hover:bg-gray-300"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-8 bg-white">
        <h3 className="text-3xl font-bold text-center text-gray-800 mb-10">
          Everything Your Team Needs in One CRM
        </h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-6 bg-gray-50 rounded-xl shadow hover:shadow-lg transition">
            <h4 className="text-xl font-semibold text-blue-600">📊 Sales Pipeline</h4>
            <p className="mt-2 text-gray-600">
              Track deals across every stage with real-time updates and drag &
              drop pipeline management.
            </p>
          </div>
          <div className="p-6 bg-gray-50 rounded-xl shadow hover:shadow-lg transition">
            <h4 className="text-xl font-semibold text-blue-600">👥 Contact Management</h4>
            <p className="mt-2 text-gray-600">
              Store customer details, interactions, and communication history in
              one centralized hub.
            </p>
          </div>
          <div className="p-6 bg-gray-50 rounded-xl shadow hover:shadow-lg transition">
            <h4 className="text-xl font-semibold text-blue-600">🤖 AI Insights</h4>
            <p className="mt-2 text-gray-600">
              Get smart predictions, reminders, and sales suggestions powered by
              AI to close more deals.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-blue-600 text-white text-center">
        <h3 className="text-3xl font-bold">Ready to Scale Your Business?</h3>
        <p className="mt-4 text-lg text-blue-100">
          Start your free trial today and transform the way your team works.
        </p>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} ProCRM. All rights reserved.
      </footer>
    </div>
  );
}