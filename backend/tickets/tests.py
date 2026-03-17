from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Ticket


class TicketApiTests(APITestCase):

    def setUp(self):
        self.ticket_one = Ticket.objects.create(
            title="Cannot reset password",
            description="Reset email never arrives.",
            category="account",
            priority="high",
            status="open"
        )
        self.ticket_two = Ticket.objects.create(
            title="Charged twice",
            description="The customer was billed two times this month.",
            category="billing",
            priority="critical",
            status="resolved"
        )
        Ticket.objects.filter(pk=self.ticket_one.pk).update(
            created_at=timezone.now() - timezone.timedelta(days=2)
        )
        Ticket.objects.filter(pk=self.ticket_two.pk).update(
            created_at=timezone.now()
        )
        self.ticket_one.refresh_from_db()
        self.ticket_two.refresh_from_db()

    def test_ticket_list_supports_search(self):
        response = self.client.get("/api/tickets/?search=reset")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.ticket_one.id)

    def test_ticket_stats_include_average_and_breakdowns(self):
        response = self.client.get("/api/tickets/stats/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_tickets"], 2)
        self.assertEqual(response.data["open_tickets"], 1)
        self.assertEqual(response.data["avg_tickets_per_day"], 0.67)
        self.assertEqual(
            list(response.data["priority_breakdown"]),
            [
                {"priority": "critical", "count": 1},
                {"priority": "high", "count": 1}
            ]
        )
