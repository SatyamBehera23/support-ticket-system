from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Ticket
from .serializers import TicketSerializer
from django.db.models import Count, Min, Max
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .llm import classify_ticket


class TicketListCreateView(generics.ListCreateAPIView):

    queryset = Ticket.objects.all().order_by("-created_at")
    serializer_class = TicketSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    filterset_fields = ["category", "priority", "status"]
    search_fields = ["title", "description"]


class TicketUpdateView(generics.UpdateAPIView):

    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    
    
class TicketStatsView(APIView):

    def get(self, request):

        total_tickets = Ticket.objects.count()
        open_tickets = Ticket.objects.filter(status="open").count()

        date_range = Ticket.objects.aggregate(
            earliest=Min("created_at"),
            latest=Max("created_at")
        )

        earliest = date_range["earliest"]
        latest = date_range["latest"]

        if earliest and latest:
            total_days = max((latest.date() - earliest.date()).days + 1, 1)
            avg_tickets_per_day = round(total_tickets / total_days, 2)
        else:
            avg_tickets_per_day = 0

        priority_counts = (
            Ticket.objects.values("priority")
            .annotate(count=Count("id"))
            .order_by("priority")
        )

        category_counts = (
            Ticket.objects.values("category")
            .annotate(count=Count("id"))
            .order_by("category")
        )

        return Response({
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "avg_tickets_per_day": avg_tickets_per_day,
            "priority_breakdown": priority_counts,
            "category_breakdown": category_counts
        })
        
class TicketClassifyView(APIView):

    def post(self, request):

        description = request.data.get("description")

        if not description:
            return Response(
                {"error": "description required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = classify_ticket(description)

        if not result:
            return Response({
                "suggested_category": None,
                "suggested_priority": None
            })

        return Response({
            "suggested_category": result.get("category"),
            "suggested_priority": result.get("priority")
        })
