interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userGrowthRate: number;
}

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowthRate: number;
  averageSessionValue: number;
}

interface SessionMetrics {
  totalSessions: number;
  completedSessions: number;
  activeSessions: number;
  sessionCompletionRate: number;
}

interface TherapistMetrics {
  totalTherapists: number;
  activeTherapists: number;
  pendingApprovals: number;
  averageRating: number;
}

interface PlatformAnalytics {
  users: UserMetrics;
  revenue: RevenueMetrics;
  sessions: SessionMetrics;
  therapists: TherapistMetrics;
  lastUpdated: string;
}

export const trackUserRegistration = (userData: any) => {
  const analytics = getAnalytics();
  
  // Update user metrics
  analytics.users.totalUsers += 1;
  analytics.users.newUsersThisMonth += 1;
  
  // Track registration event
  const events = JSON.parse(localStorage.getItem('mindcare_analytics_events') || '[]');
  events.push({
    id: Date.now().toString(),
    type: 'user_registration',
    userId: userData.id,
    userRole: userData.role,
    timestamp: new Date().toISOString(),
    data: { name: userData.name, email: userData.email, role: userData.role }
  });
  localStorage.setItem('mindcare_analytics_events', JSON.stringify(events));
  
  saveAnalytics(analytics);
  dispatchAnalyticsUpdate();
};

export const trackPayment = (paymentData: any) => {
  const analytics = getAnalytics();
  const amount = parseFloat(paymentData.amount.replace('$', ''));
  
  // Update revenue metrics
  analytics.revenue.totalRevenue += amount;
  analytics.revenue.monthlyRevenue += amount;
  
  // Track payment event
  const events = JSON.parse(localStorage.getItem('mindcare_analytics_events') || '[]');
  events.push({
    id: Date.now().toString(),
    type: 'payment_processed',
    userId: paymentData.patientId,
    therapistId: paymentData.therapistId,
    timestamp: new Date().toISOString(),
    data: { amount, sessionType: paymentData.sessionType }
  });
  localStorage.setItem('mindcare_analytics_events', JSON.stringify(events));
  
  saveAnalytics(analytics);
  dispatchAnalyticsUpdate();
};

export const trackSessionStart = (sessionData: any) => {
  const analytics = getAnalytics();
  
  // Update session metrics
  analytics.sessions.activeSessions += 1;
  
  // Track session event
  const events = JSON.parse(localStorage.getItem('mindcare_analytics_events') || '[]');
  events.push({
    id: Date.now().toString(),
    type: 'session_started',
    userId: sessionData.patientId,
    therapistId: sessionData.therapistId,
    timestamp: new Date().toISOString(),
    data: { sessionType: sessionData.sessionType, duration: sessionData.duration }
  });
  localStorage.setItem('mindcare_analytics_events', JSON.stringify(events));
  
  saveAnalytics(analytics);
  dispatchAnalyticsUpdate();
};

export const trackSessionComplete = (sessionData: any) => {
  const analytics = getAnalytics();
  
  // Update session metrics
  analytics.sessions.completedSessions += 1;
  analytics.sessions.totalSessions += 1;
  analytics.sessions.activeSessions = Math.max(0, analytics.sessions.activeSessions - 1);
  
  // Track session event
  const events = JSON.parse(localStorage.getItem('mindcare_analytics_events') || '[]');
  events.push({
    id: Date.now().toString(),
    type: 'session_completed',
    userId: sessionData.patientId,
    therapistId: sessionData.therapistId,
    timestamp: new Date().toISOString(),
    data: { 
      sessionType: sessionData.sessionType, 
      duration: sessionData.duration,
      rating: sessionData.rating || 5
    }
  });
  localStorage.setItem('mindcare_analytics_events', JSON.stringify(events));
  
  saveAnalytics(analytics);
  dispatchAnalyticsUpdate();
};

export const trackTherapistApproval = (therapistData: any) => {
  const analytics = getAnalytics();
  
  // Update therapist metrics
  analytics.therapists.activeTherapists += 1;
  analytics.therapists.pendingApprovals = Math.max(0, analytics.therapists.pendingApprovals - 1);
  
  // Track approval event
  const events = JSON.parse(localStorage.getItem('mindcare_analytics_events') || '[]');
  events.push({
    id: Date.now().toString(),
    type: 'therapist_approved',
    therapistId: therapistData.therapistId,
    timestamp: new Date().toISOString(),
    data: { name: therapistData.therapistName, specialization: therapistData.specialization }
  });
  localStorage.setItem('mindcare_analytics_events', JSON.stringify(events));
  
  saveAnalytics(analytics);
  dispatchAnalyticsUpdate();
};

export const trackTherapistRegistration = (therapistData: any) => {
  const analytics = getAnalytics();
  
  // Update therapist metrics
  analytics.therapists.totalTherapists += 1;
  analytics.therapists.pendingApprovals += 1;
  
  // Track registration event
  const events = JSON.parse(localStorage.getItem('mindcare_analytics_events') || '[]');
  events.push({
    id: Date.now().toString(),
    type: 'therapist_registration',
    therapistId: therapistData.therapistId,
    timestamp: new Date().toISOString(),
    data: { name: therapistData.therapistName, specialization: therapistData.specialization }
  });
  localStorage.setItem('mindcare_analytics_events', JSON.stringify(events));
  
  saveAnalytics(analytics);
  dispatchAnalyticsUpdate();
};

export const calculatePatientEngagement = () => {
  // Get all registered users and filter patients
  const registeredUsers = JSON.parse(localStorage.getItem('mindcare_registered_users') || '[]');
  const patients = registeredUsers.filter((u: any) => u.role === 'patient');
  
  // Get activity data
  const moodEntries = JSON.parse(localStorage.getItem('mindcare_mood_entries') || '[]');
  const cbtRecords = JSON.parse(localStorage.getItem('mindcare_cbt_records') || '[]');
  const gratitudeEntries = JSON.parse(localStorage.getItem('mindcare_gratitude_entries') || '[]');
  const sleepLogs = JSON.parse(localStorage.getItem('mindcare_sleep_logs') || '[]');
  const bookings = JSON.parse(localStorage.getItem('mindcare_bookings') || '[]');
  const streakData = JSON.parse(localStorage.getItem('mindcare_streak_data') || '{}');
  
  // Calculate engagement for each patient
  const patientEngagement = patients.map((patient: any) => {
    let activityScore = 0;
    
    // Count activities in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Mood tracking activities
    const recentMoodEntries = moodEntries.filter((entry: any) => 
      entry.userId === patient.id && new Date(entry.date) >= thirtyDaysAgo
    ).length;
    
    // Therapy module activities
    const recentCBT = cbtRecords.filter((record: any) => 
      record.userId === patient.id && new Date(record.date) >= thirtyDaysAgo
    ).length;
    
    const recentGratitude = gratitudeEntries.filter((entry: any) => 
      entry.userId === patient.id && new Date(entry.date) >= thirtyDaysAgo
    ).length;
    
    const recentSleep = sleepLogs.filter((log: any) => 
      log.userId === patient.id && new Date(log.date) >= thirtyDaysAgo
    ).length;
    
    // Session attendance
    const recentSessions = bookings.filter((booking: any) => 
      booking.patientId === patient.id && 
      booking.status === 'completed' &&
      new Date(booking.date) >= thirtyDaysAgo
    ).length;
    
    // Calculate total activity score
    activityScore = recentMoodEntries + recentCBT + recentGratitude + recentSleep + (recentSessions * 2);
    
    // Add demo patient if no real patients
    return {
      patientId: patient.id,
      patientName: patient.name,
      activityScore,
      lastActivity: patient.lastActivity || new Date().toISOString()
    };
  });
  
  // Add demo patient data if no real patients exist
  if (patients.length === 0) {
    patientEngagement.push({
      patientId: 'demo-patient',
      patientName: 'John Doe (Demo)',
      activityScore: 15,
      lastActivity: new Date().toISOString()
    });
  }
  
  // Categorize engagement levels
  const totalPatients = Math.max(patientEngagement.length, 1);
  let highlyActive = 0;
  let moderatelyActive = 0;
  let lowActivity = 0;
  
  patientEngagement.forEach(patient => {
    if (patient.activityScore >= 10) {
      highlyActive++;
    } else if (patient.activityScore >= 5) {
      moderatelyActive++;
    } else {
      lowActivity++;
    }
  });
  
  // If no real data, use demo percentages
  if (patientEngagement.every(p => p.activityScore === 0)) {
    highlyActive = Math.floor(totalPatients * 0.35);
    moderatelyActive = Math.floor(totalPatients * 0.45);
    lowActivity = totalPatients - highlyActive - moderatelyActive;
  }
  
  return [
    { name: 'Highly Active', value: highlyActive, color: '#10B981' },
    { name: 'Moderately Active', value: moderatelyActive, color: '#3B82F6' },
    { name: 'Low Activity', value: lowActivity, color: '#F59E0B' }
  ];
};

export { calculatePatientEngagement };

export const getAnalytics = (): PlatformAnalytics => {
  const saved = localStorage.getItem('mindcare_platform_analytics');
  if (saved) {
    return JSON.parse(saved);
  }
  
  // Initialize with current data
  const registeredUsers = JSON.parse(localStorage.getItem('mindcare_registered_users') || '[]');
  const therapistServices = JSON.parse(localStorage.getItem('mindcare_therapist_services') || '[]');
  const bookings = JSON.parse(localStorage.getItem('mindcare_bookings') || '[]');
  
  const demoUsers = 3; // Demo users (patient, therapist, admin)
  const totalUsers = registeredUsers.length + demoUsers;
  const totalTherapists = therapistServices.length + 1; // +1 for demo therapist
  const activeTherapists = therapistServices.filter((s: any) => s.status === 'approved').length + 1;
  const pendingApprovals = therapistServices.filter((s: any) => s.status === 'pending').length;
  
  const completedSessions = bookings.filter((b: any) => b.status === 'completed').length;
  const totalSessions = bookings.length;
  
  // Calculate revenue from completed bookings
  const totalRevenue = bookings
    .filter((b: any) => b.status === 'completed')
    .reduce((sum: number, booking: any) => {
      const amount = parseFloat(booking.amount?.replace('$', '') || '0');
      return sum + amount;
    }, 0);

  const initialAnalytics: PlatformAnalytics = {
    users: {
      totalUsers,
      activeUsers: Math.floor(totalUsers * 0.8),
      newUsersThisMonth: Math.floor(totalUsers * 0.2),
      userGrowthRate: 12.5
    },
    revenue: {
      totalRevenue,
      monthlyRevenue: totalRevenue,
      revenueGrowthRate: 18.2,
      averageSessionValue: totalSessions > 0 ? totalRevenue / totalSessions : 120
    },
    sessions: {
      totalSessions,
      completedSessions,
      activeSessions: bookings.filter((b: any) => b.status === 'confirmed').length,
      sessionCompletionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
    },
    therapists: {
      totalTherapists,
      activeTherapists,
      pendingApprovals,
      averageRating: 4.7
    },
    lastUpdated: new Date().toISOString()
  };
  
  saveAnalytics(initialAnalytics);
  return initialAnalytics;
};

export const updateAnalyticsFromCurrentData = () => {
  const registeredUsers = JSON.parse(localStorage.getItem('mindcare_registered_users') || '[]');
  const therapistServices = JSON.parse(localStorage.getItem('mindcare_therapist_services') || '[]');
  const bookings = JSON.parse(localStorage.getItem('mindcare_bookings') || '[]');
  
  const analytics = getAnalytics();
  
  // Update user metrics
  const demoUsers = 3;
  analytics.users.totalUsers = registeredUsers.length + demoUsers;
  analytics.users.activeUsers = Math.floor(analytics.users.totalUsers * 0.8);
  
  // Update therapist metrics
  analytics.therapists.totalTherapists = therapistServices.length + 1; // +1 for demo therapist
  analytics.therapists.activeTherapists = therapistServices.filter((s: any) => s.status === 'approved').length + 1;
  analytics.therapists.pendingApprovals = therapistServices.filter((s: any) => s.status === 'pending').length;
  
  // Update session metrics
  const completedSessions = bookings.filter((b: any) => b.status === 'completed').length;
  const totalSessions = bookings.length;
  analytics.sessions.totalSessions = totalSessions;
  analytics.sessions.completedSessions = completedSessions;
  analytics.sessions.activeSessions = bookings.filter((b: any) => b.status === 'confirmed').length;
  analytics.sessions.sessionCompletionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
  
  // Update revenue metrics
  const totalRevenue = bookings
    .filter((b: any) => b.status === 'completed')
    .reduce((sum: number, booking: any) => {
      const amount = parseFloat(booking.amount?.replace('$', '') || '0');
      return sum + amount;
    }, 0);
  
  analytics.revenue.totalRevenue = totalRevenue;
  analytics.revenue.monthlyRevenue = totalRevenue;
  analytics.revenue.averageSessionValue = totalSessions > 0 ? totalRevenue / totalSessions : 120;
  
  analytics.lastUpdated = new Date().toISOString();
  
  saveAnalytics(analytics);
  return analytics;
};

export const generateTimeSeriesData = () => {
  const events = JSON.parse(localStorage.getItem('mindcare_analytics_events') || '[]');
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  return last30Days.map(date => {
    const dayEvents = events.filter((e: any) => e.timestamp.startsWith(date));
    const userRegistrations = dayEvents.filter((e: any) => e.type === 'user_registration').length;
    const sessionsCompleted = dayEvents.filter((e: any) => e.type === 'session_completed').length;
    const paymentsProcessed = dayEvents.filter((e: any) => e.type === 'payment_processed').length;
    const revenue = dayEvents
      .filter((e: any) => e.type === 'payment_processed')
      .reduce((sum: number, e: any) => sum + (e.data?.amount || 0), 0);

    return {
      date,
      users: userRegistrations,
      sessions: sessionsCompleted,
      payments: paymentsProcessed,
      revenue
    };
  });
};

export const getRecentActivity = () => {
  const events = JSON.parse(localStorage.getItem('mindcare_analytics_events') || '[]');
  return events
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)
    .map((event: any) => ({
      id: event.id,
      type: event.type,
      description: getEventDescription(event),
      timestamp: getRelativeTime(event.timestamp),
      icon: getEventIcon(event.type)
    }));
};

const getEventDescription = (event: any) => {
  switch (event.type) {
    case 'user_registration':
      return `New ${event.data.role} registered: ${event.data.name}`;
    case 'therapist_approved':
      return `Therapist approved: ${event.data.name}`;
    case 'payment_processed':
      return `Payment processed: $${event.data.amount} session fee`;
    case 'session_started':
      return `Therapy session started`;
    case 'session_completed':
      return `Therapy session completed`;
    case 'therapist_registration':
      return `New therapist application: ${event.data.name}`;
    default:
      return 'Platform activity';
  }
};

const getEventIcon = (type: string) => {
  switch (type) {
    case 'user_registration': return 'Users';
    case 'therapist_approved': return 'CheckCircle';
    case 'payment_processed': return 'DollarSign';
    case 'session_started': return 'Play';
    case 'session_completed': return 'CheckCircle';
    case 'therapist_registration': return 'UserPlus';
    default: return 'Activity';
  }
};

const getRelativeTime = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const saveAnalytics = (analytics: PlatformAnalytics) => {
  localStorage.setItem('mindcare_platform_analytics', JSON.stringify(analytics));
};

const dispatchAnalyticsUpdate = () => {
  window.dispatchEvent(new CustomEvent('mindcare-analytics-updated'));
};