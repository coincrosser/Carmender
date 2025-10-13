export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function showNotification(title: string, body: string, tag?: string) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icon.png',
      tag: tag || 'bill-reminder',
      requireInteraction: true
    });
  }
}

export function checkUpcomingBills(bills: any[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const threeDays = new Date(today);
  threeDays.setDate(threeDays.getDate() + 3);

  bills.forEach(bill => {
    const billDate = new Date(bill.date);
    billDate.setHours(0, 0, 0, 0);

    if (bill.status !== 'paid') {
      if (billDate.getTime() === today.getTime()) {
        showNotification(
          'Bill Due Today!',
          `${bill.description} - $${bill.amount?.toFixed(2) || 'Amount TBD'}`,
          `bill-${bill.id}`
        );
      } else if (billDate.getTime() === tomorrow.getTime()) {
        showNotification(
          'Bill Due Tomorrow',
          `${bill.description} - $${bill.amount?.toFixed(2) || 'Amount TBD'}`,
          `bill-${bill.id}`
        );
      } else if (billDate.getTime() === threeDays.getTime()) {
        showNotification(
          'Upcoming Bill',
          `${bill.description} due in 3 days - $${bill.amount?.toFixed(2) || 'Amount TBD'}`,
          `bill-${bill.id}`
        );
      }
    }
  });
}
