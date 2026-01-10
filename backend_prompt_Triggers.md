@router.get("", response_model=PromptTriggersListResponse)
async def get_prompt_triggers(
    page: int = Query(1, ge=1, description="Page number (starts from 1)"),
    page_size: int = Query(100, ge=1, le=100, description="Items per page (max 100)"),
    date_range_start: Optional[date] = Query(None, description="Start date for document date filter (inclusive)"),
    date_range_end: Optional[date] = Query(None, description="End date for document date filter (inclusive)"),
    companies: Optional[str] = Query(None, description="Comma-separated list of company names to filter"),
    buckets: Optional[str] = Query(None, description="Comma-separated list of bucket names (e.g., 'Business Model,Growth Prospects')"),
    questions: Optional[str] = Query(None, description="Comma-separated list of question IDs to filter"),
    document_type: Optional[str] = Query(None, description="Filter by document type (e.g., 'Earnings Call', 'Annual Report')"),
    min_total_triggers: Optional[int] = Query(None, ge=0, description="Minimum total trigger count"),
    max_total_triggers: Optional[int] = Query(None, ge=0, description="Maximum total trigger count"),
    bucket_count_filters: Optional[str] = Query(None, description="Per-bucket count filters. Format: 'Bucket Name:min-max,...'. Example: 'Business Model:1-5,Growth Prospects:2-'"),
    sort_by: str = Query("earning_call_date", description="Sort by: 'earning_call_date', 'company_name', 'total_triggers', 'document_type', 'Business Model', 'Competitive Advantage', 'Management Quality', 'Financial Health', 'Growth Prospects'"),
    sort_order: str = Query("desc", description="Sort order: 'asc' or 'desc'"),
    include_filter_options: bool = Query(False, description="Include filter options in response (for initial load)"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get paginated list of documents with prompt triggers.

    **Default Behavior:**
    - If no date range is provided, defaults to last 30 days
    - Default sort: earning_call_date DESC (newest first)
    - Only includes documents with at least one YES trigger

    **Filters:**
    - `date_range_start` & `date_range_end`: Filter by document date
    - `companies`: Filter by company names (OR logic within)
    - `buckets`: Filter by bucket names - shows docs where ALL selected buckets have >=1 YES trigger (AND logic)
    - `questions`: Filter by specific question IDs - shows docs where exact questions have YES trigger
    - `document_type`: Filter by document type (e.g., "Earnings Call")
    - `min_total_triggers` & `max_total_triggers`: Filter by total trigger count range
    - `bucket_count_filters`: Per-bucket count range filters (format: "Bucket Name:min-max")

    **Multi-select Logic:**
    - Multiple companies = OR (match any selected company)
    - Multiple buckets = AND (must have triggers in ALL selected buckets)
    - Multiple filter types = AND

    **Table Columns (fixed order):**
    - Company Name (sortable, clickable)
    - Document Type (e.g., "Earnings Call") (sortable)
    - Document Date (sortable)
    - Total Triggers (sortable)
    - Business Model count (badge style, sortable)
    - Competitive Advantage count (sortable)
    - Management Quality count (sortable)
    - Financial Health count (sortable)
    - Growth Prospects count (sortable)

    **Response:**
    - Paginated list of documents with bucket counts
    - Pagination metadata
    - Filter options (if include_filter_options=true)
    """

    try:
        logger.info("=== Prompt Triggers Request Started ===")
        logger.info(f"Parameters: page={page}, page_size={page_size}")
        logger.info(f"Filters: dates={date_range_start}-{date_range_end}, companies={companies}, buckets={buckets}, questions={questions}")
        logger.info(f"Additional filters: document_type={document_type}, min_total={min_total_triggers}, max_total={max_total_triggers}, bucket_filters={bucket_count_filters}")

        # Default to last 30 days if no date range
        if date_range_start is None and date_range_end is None:
            date_range_end = date.today()
            date_range_start = date(2020, 1, 1)
            logger.info(f"Applied default date range: {date_range_start} to {date_range_end}")

        # Parse filters
        companies_list = parse_comma_separated(companies)
        buckets_list = parse_comma_separated(buckets)
        questions_list = parse_int_list(questions)
        parsed_bucket_count_filters = parse_bucket_count_filters(bucket_count_filters)

        # Validate sort parameters
        valid_sort_fields = [
            "earning_call_date", "company_name", "total_triggers", "document_type",
            "Business Model", "Competitive Advantage", "Management Quality",
            "Financial Health", "Growth Prospects"
        ]
        if sort_by not in valid_sort_fields:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid sort_by: {sort_by}. Valid options: {', '.join(valid_sort_fields)}"
            )

        if sort_order not in ["asc", "desc"]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid sort_order: {sort_order}. Valid options: 'asc', 'desc'"
            )

        # Initialize repository
        repo = PromptTriggerRepository()

        # Get documents
        documents, total_count = await repo.get_prompt_triggers(
            session=session,
            page=page,
            page_size=page_size,
            date_range_start=date_range_start,
            date_range_end=date_range_end,
            company_names=companies_list,
            bucket_names=buckets_list,
            question_ids=questions_list,
            sort_by=sort_by,
            sort_order=sort_order,
            document_type=document_type,
            min_total_triggers=min_total_triggers,
            max_total_triggers=max_total_triggers,
            bucket_count_filters=parsed_bucket_count_filters,
        )

        # Calculate pagination info
        total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 0
        showing_from = (page - 1) * page_size + 1 if total_count > 0 else 0
        showing_to = min(page * page_size, total_count)

        pagination = PaginationInfo(
            current_page=page,
            page_size=page_size,
            total_count=total_count,
            total_pages=total_pages,
            showing_from=showing_from,
            showing_to=showing_to,
            has_next=page < total_pages,
            has_prev=page > 1,
        )

        # Get filter options if requested
        filter_options = None
        if include_filter_options:
            filter_data = await repo.get_filter_options(
                session=session,
                date_range_start=date_range_start,
                date_range_end=date_range_end,
            )

            filter_options = FilterOptions(
                companies=filter_data["companies"],
                buckets=[
                    BucketInfo(
                        name=b["name"],
                        id=b["id"],
                        questions=[
                            QuestionInfo(
                                qid=q["qid"],
                                question_text=q["question_text"],
                                bucket=q["bucket"],
                                source_shorthand=q.get("source_shorthand"),
                                is_active=q.get("is_active", True)
                            )
                            for q in b["questions"]
                        ]
                    )
                    for b in filter_data["buckets"]
                ],
                questions=[
                    QuestionInfo(
                        qid=q["qid"],
                        question_text=q["question_text"],
                        bucket=q["bucket"],
                        source_shorthand=q.get("source_shorthand"),
                        is_active=q.get("is_active", True)
                    )
                    for q in filter_data["questions"]
                ],
                document_types=filter_data.get("document_types", ["Earnings Call"]),
                trigger_count_range=TriggerCountRange(
                    min=filter_data.get("trigger_count_range", {}).get("min", 0),
                    max=filter_data.get("trigger_count_range", {}).get("max", 0),
                ),
                date_range=DateRange(
                    start=filter_data["date_range"]["start"],
                    end=filter_data["date_range"]["end"],
                ),
            )

        # Build response
        response = PromptTriggersListResponse(
            data=[PromptTriggerListItem(**doc) for doc in documents],
            pagination=pagination,
            filter_options=filter_options,
        )

        logger.info(f"=== Prompt Triggers Request Completed === Returned {len(documents)} documents")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_prompt_triggers: {type(e).__name__}: {str(e)}")
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching prompt triggers: {str(e)}"
        )
