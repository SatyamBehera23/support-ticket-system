from django.shortcuts import render

# Create your views here.
from rest_framework import generics,filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Ticket
from .serializers import TicketSerializer
from django.db.models import Count
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

        priority_counts = (
            Ticket.objects.values("priority")
            .annotate(count=Count("id"))
        )

        category_counts = (
            Ticket.objects.values("category")
            .annotate(count=Count("id"))
        )

        return Response({
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
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