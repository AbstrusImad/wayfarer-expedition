from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded


def test_expedition_consensus_flow():
    """Begin an expedition (deterministic), then take an AI-judged action and
    confirm the warden's verdict is sealed under consensus and state advances."""
    factory = get_contract_factory("Wayfarer")
    contract = factory.deploy(args=[])

    # deterministic start
    begin = contract.begin_expedition(args=["open-sea"]).transact()
    assert tx_execution_succeeded(begin)

    runs = contract.get_runs(args=[0]).call()
    assert len(runs) == 1
    run = runs[0]
    run_id = run["id"]
    assert run["vitality"] == 100
    assert run["day"] == 1
    assert run["status"] == "ALIVE"

    # AI consensus turn
    action = (
        "Ration the fresh water to small sips, rig the tarp to catch rain and "
        "shade me from the sun, and stay with the raft so rescuers can spot it."
    )
    turn = contract.take_action(args=[run_id, action]).transact()
    assert tx_execution_succeeded(turn)

    updated = contract.get_run(args=[run_id]).call()
    # the warden must have produced exactly one logged turn and advanced state
    assert updated["turns"] == 1
    assert len(updated["log"]) == 1
    entry = updated["log"][0]
    assert entry["verdict"] in ("THRIVE", "STABLE", "SETBACK", "PERIL")
    assert -40 <= entry["delta"] <= 20
    assert 0 <= updated["vitality"] <= 100

    stats = contract.get_stats().call()
    assert stats["expeditions"] >= 1
    assert stats["turns"] >= 1
