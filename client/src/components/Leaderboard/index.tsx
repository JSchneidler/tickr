import { Modal, Table, Badge, Text } from "@mantine/core";

import { useAppSelector } from "../../store/hooks";
import { selectLeaderboard } from "../../store/leaderboard";
import { useMeQuery } from "../../store/api";
import rankDisplay from "./rankDisplay";

interface LeaderboardProps {
  opened: boolean;
  onClose: () => void;
}

function medalColor(rank: number): string {
  if (rank === 1) return "yellow";
  if (rank === 2) return "gray";
  if (rank === 3) return "orange";
  return "blue";
}

function Leaderboard({ opened, onClose }: LeaderboardProps) {
  const { data: user } = useMeQuery();
  const entries = useAppSelector(selectLeaderboard);

  const rows = entries.map((entry) => {
    const isMe = user?.id === entry.userId;
    return (
      <Table.Tr
        key={entry.userId}
        bg={isMe ? "var(--mantine-color-blue-light)" : undefined}
      >
        <Table.Td>
          <Badge
            color={medalColor(entry.rank)}
            variant={entry.rank <= 3 ? "filled" : "outline"}
          >
            {rankDisplay(entry.rank)}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Text fw={isMe ? 700 : undefined}>{entry.name}</Text>
        </Table.Td>
        <Table.Td ta="right">
          <Text ff="monospace">
            $
            {Number(entry.portfolioValue).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Leaderboard"
      centered
      size="md"
    >
      {entries.length === 0 ? (
        <Text c="dimmed" ta="center">
          No data yet
        </Text>
      ) : (
        <Table striped={false} highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Rank</Table.Th>
              <Table.Th>Trader</Table.Th>
              <Table.Th ta="right">Portfolio Value</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      )}
    </Modal>
  );
}

export default Leaderboard;
