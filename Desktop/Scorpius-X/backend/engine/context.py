
from typing import Dict
from .models import ScanJob

class ScorpiusContext:
    def __init__(self):
        self.jobs: Dict[str, ScanJob] = {}

    def add_job(self, job: ScanJob):
        self.jobs[job.job_id] = job

    def get_job(self, job_id: str) -> ScanJob | None:
        return self.jobs.get(job_id)
