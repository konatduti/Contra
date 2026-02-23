export type Company = {
  id: string;
  name: string;
  seats: number;
  monthlyCredits: number;
  oneOffCredits: number;
};

export type CompanyMember = {
  id: string;
  companyId: string;
  username: string;
  email: string;
  role: "Owner" | "Company organiser" | "Member" | "Admin";
  monthlyCredits: number;
  oneOffCredits: number;
};

export type AccessRequest = {
  id: string;
  contact: string;
  username: string;
  company: string;
  email: string;
  message: string;
};

export type ActivityEntry = {
  id: string;
  timestamp: string;
  ip: string;
  location: string;
  type: string;
  userAgent: string;
  paths: string[];
  details: string;
};

export type AdminUser = {
  id: string;
  username: string;
  email: string;
  companyId?: string;
  roleAdmin: boolean;
  roleOrganiser: boolean;
  credits: number;
};

export const companies: Company[] = [
  {
    id: "contra-tech",
    name: "Contra Technologies Kft.",
    seats: 2,
    monthlyCredits: 999,
    oneOffCredits: 998
  },
  {
    id: "signal-bridge",
    name: "Signal Bridge Ltd.",
    seats: 12,
    monthlyCredits: 1200,
    oneOffCredits: 300
  },
  {
    id: "atlas-legal",
    name: "Atlas Legal Partners",
    seats: 4,
    monthlyCredits: 500,
    oneOffCredits: 210
  }
];

export const companyMembers: CompanyMember[] = [
  {
    id: "member-1",
    companyId: "contra-tech",
    username: "amara",
    email: "amara@contra.io",
    role: "Owner",
    monthlyCredits: 350,
    oneOffCredits: 120
  },
  {
    id: "member-2",
    companyId: "contra-tech",
    username: "soren",
    email: "soren@contra.io",
    role: "Company organiser",
    monthlyCredits: 200,
    oneOffCredits: 80
  },
  {
    id: "member-3",
    companyId: "contra-tech",
    username: "joanna",
    email: "joanna@contra.io",
    role: "Member",
    monthlyCredits: 150,
    oneOffCredits: 60
  },
  {
    id: "member-4",
    companyId: "signal-bridge",
    username: "kenji",
    email: "kenji@signalbridge.com",
    role: "Owner",
    monthlyCredits: 400,
    oneOffCredits: 120
  }
];

export const accessRequests: AccessRequest[] = [
  {
    id: "request-1",
    contact: "Maya Li",
    username: "mayali",
    company: "Signal Bridge Ltd.",
    email: "maya@signalbridge.com",
    message: "We need admin access for our compliance team."
  },
  {
    id: "request-2",
    contact: "Ibrahim H",
    username: "ibrahimh",
    company: "Atlas Legal Partners",
    email: "ibrahim@atlaslegal.com",
    message: "Requesting organiser seat for intake review."
  }
];

export const activityEntries: ActivityEntry[] = [
  {
    id: "activity-1",
    timestamp: "2024-03-01 09:15",
    ip: "104.28.88.12",
    location: "Berlin, DE",
    type: "Recent visit",
    userAgent: "Chrome 121 / macOS",
    paths: ["/documents/summary", "/upload", "/settings"],
    details: "Viewed three documents."
  },
  {
    id: "activity-2",
    timestamp: "2024-03-02 14:02",
    ip: "52.110.13.45",
    location: "London, UK",
    type: "Login",
    userAgent: "Safari 17 / iOS",
    paths: ["/login", "/"],
    details: "Logged in with SSO."
  },
  {
    id: "activity-3",
    timestamp: "2024-03-04 11:22",
    ip: "18.192.4.77",
    location: "Budapest, HU",
    type: "Recent visit",
    userAgent: "Edge 120 / Windows",
    paths: ["/documents", "/documents/9231", "/credits"],
    details: "Reviewed credits and reports."
  },
  {
    id: "activity-4",
    timestamp: "2024-03-06 17:55",
    ip: "134.33.8.90",
    location: "New York, US",
    type: "Recent visit",
    userAgent: "Chrome 121 / Windows",
    paths: ["/upload", "/documents/quality"],
    details: "Uploaded new contract."
  }
];

export const creditHistoryEntries: ActivityEntry[] = [
  {
    id: "credit-1",
    timestamp: "2024-03-05 10:40",
    ip: "18.192.4.77",
    location: "Budapest, HU",
    type: "Credit change",
    userAgent: "Admin action",
    paths: ["Monthly: +50", "One-off: +20"],
    details: "Added credits from admin dashboard."
  },
  {
    id: "credit-2",
    timestamp: "2024-03-06 15:12",
    ip: "52.110.13.45",
    location: "London, UK",
    type: "Credit use",
    userAgent: "Auto deduction",
    paths: ["Monthly: -10"],
    details: "Credits used for analysis run."
  }
];

export const adminUsers: AdminUser[] = [
  {
    id: "user-1",
    username: "amara",
    email: "amara@contra.io",
    companyId: "contra-tech",
    roleAdmin: true,
    roleOrganiser: true,
    credits: 120
  },
  {
    id: "user-2",
    username: "soren",
    email: "soren@contra.io",
    companyId: "contra-tech",
    roleAdmin: false,
    roleOrganiser: true,
    credits: 80
  },
  {
    id: "user-3",
    username: "kenji",
    email: "kenji@signalbridge.com",
    companyId: "signal-bridge",
    roleAdmin: false,
    roleOrganiser: false,
    credits: 45
  }
];
