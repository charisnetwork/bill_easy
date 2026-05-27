import React, { useEffect, useState } from "react";
import { companyAPI } from "../services/api";

export default function CompanySwitcher() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const res = await companyAPI.getCompanies();
    setCompanies(res.data);
    setSelectedCompany(res.data[0]);
  };

  const handleChange = (e) => {
    const company = companies.find(c => c.id === Number(e.target.value));
    setSelectedCompany(company);
  };

  if (!selectedCompany) return null;

  return (
    <div className="p-4 border-b">

      {/* App Name */}
      <h2 className="font-bold text-lg">Bill Easy</h2>

      {/* Company Dropdown */}
      <select
        value={selectedCompany.id}
        onChange={handleChange}
        className="mt-2 w-full border rounded p-1"
      >
        {companies.map(c => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Contact Info */}
      <div className="text-sm mt-2 text-gray-600">
        <div>Contact: {selectedCompany.contact_person}</div>
        <div>Mobile: {selectedCompany.mobile}</div>
      </div>

    </div>
  );
}
